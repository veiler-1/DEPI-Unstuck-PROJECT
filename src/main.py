import os
import sys
import json
import time
import argparse
from datetime import datetime
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import mostaql_scraper
import Khamsat_scraper
import nafezly_scraper
import Freelancer_scraper
import database


def run_mostaql(pages: int, output_file: Optional[str] = None) -> List[Dict[str, Any]]:
    print(f"[*] Starting Mostaql scraper (pages={pages})...")
    start = time.time()
    results = mostaql_scraper.scrape_mostaql(max_pages=pages, output_file=output_file)
    elapsed = time.time() - start
    print(f"[+] Mostaql completed in {elapsed:.1f}s | {len(results or [])} projects fetched")
    return results or []


def run_khamsat(pages: int, output_file: Optional[str] = None) -> List[Dict[str, Any]]:
    print(f"[*] Starting Khamsat scraper (pages={pages})...")
    start = time.time()
    results = Khamsat_scraper.scrape_khamsat_requests(num_pages=pages, output_file=output_file)
    elapsed = time.time() - start
    print(f"[+] Khamsat completed in {elapsed:.1f}s | {len(results or [])} requests fetched")
    return results or []


def run_nafezly(pages: int, delay: float, output_file: Optional[str] = None) -> List[Dict[str, Any]]:
    print(f"[*] Starting Nafezly scraper (pages={pages})...")
    start = time.time()
    results = nafezly_scraper.scrape_nafezly(pages=pages, delay=delay)
    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
    elapsed = time.time() - start
    print(f"[+] Nafezly completed in {elapsed:.1f}s | {len(results or [])} projects fetched")
    return results or []


def run_freelancer(pages: int, max_jobs: Optional[int], delay: float, output_file: Optional[str] = None) -> List[Dict[str, Any]]:
    print(f"[*] Starting Freelancer scraper (pages={pages})...")
    start = time.time()
    results = Freelancer_scraper.run_scraper(
        num_pages=pages,
        max_jobs=max_jobs,
        delay=delay,
        output_file=output_file
    )
    elapsed = time.time() - start
    print(f"[+] Freelancer completed in {elapsed:.1f}s | {len(results or [])} jobs fetched")
    return results or []


def main():
    parser = argparse.ArgumentParser(description="Multi-platform freelance jobs scraper")
    parser.add_argument("--pages", type=int, default=1, help="Pages to scrape per site")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests in seconds")
    parser.add_argument("--max-jobs", type=int, default=None, help="Max jobs limit for Freelancer")
    parser.add_argument("--output", type=str, default="all_projects.json", help="JSON output file")
    parser.add_argument("--skip", nargs="*", default=[], help="Platforms to skip: mostaql, khamsat, nafezly, freelancer")
    parser.add_argument("--sequential", action="store_true", help="Run scrapers sequentially instead of concurrently")

    args = parser.parse_args()
    skip_list = [s.lower() for s in args.skip]

    total_start = time.time()

    all_tasks = {
        "mostaql": {
            "name": "Mostaql",
            "runner": lambda: run_mostaql(pages=args.pages, output_file=None),
        },
        "khamsat": {
            "name": "Khamsat",
            "runner": lambda: run_khamsat(pages=args.pages, output_file=None),
        },
        "nafezly": {
            "name": "Nafezly",
            "runner": lambda: run_nafezly(pages=args.pages, delay=args.delay, output_file=None),
        },
        "freelancer": {
            "name": "Freelancer",
            "runner": lambda: run_freelancer(
                pages=args.pages,
                max_jobs=args.max_jobs,
                delay=args.delay,
                output_file=None
            ),
        },
    }

    active_tasks = {k: v for k, v in all_tasks.items() if k not in skip_list}

    mode_label = "Sequential" if args.sequential else f"Parallel ({len(active_tasks)} workers)"
    print(f"[Info] Running mode: {mode_label} | Pages per platform: {args.pages}")
    print(f"[Info] Active platforms: {', '.join(v['name'] for v in active_tasks.values())}")

    summary = []
    collected_results = {}

    if not args.sequential:
        futures_map = {}
        with ThreadPoolExecutor(max_workers=len(active_tasks)) as executor:
            for key, info in active_tasks.items():
                future = executor.submit(info["runner"])
                futures_map[future] = (key, info)

            for future in as_completed(futures_map):
                key, info = futures_map[future]
                try:
                    res = future.result() or []
                    summary.append((info["name"], "Success", len(res)))
                    collected_results[key] = res
                except Exception as e:
                    print(f"[Error] {info['name']} failed: {e}")
                    summary.append((info["name"], f"Failed: {e}", 0))
                    collected_results[key] = []
    else:
        for key, info in active_tasks.items():
            try:
                res = info["runner"]() or []
                summary.append((info["name"], "Success", len(res)))
                collected_results[key] = res
            except Exception as e:
                print(f"[Error] {info['name']} failed: {e}")
                summary.append((info["name"], f"Failed: {e}", 0))
                collected_results[key] = []

    all_projects_flat = []
    for platform_key, items in collected_results.items():
        for item in items:
            if "platform" not in item:
                item["platform"] = platform_key.capitalize()
            all_projects_flat.append(item)

    total_projects = len(all_projects_flat)

    db_result = database.save_projects_batch(all_projects_flat)

    if args.output:
        final_output_data = {
            "metadata": {
                "scraped_at": datetime.now().isoformat(),
                "total_projects": total_projects,
                "pages_per_site": args.pages,
                "counts": {k: len(v) for k, v in collected_results.items()},
                "database_sync": db_result,
            },
            "projects": all_projects_flat,
            "by_platform": collected_results
        }
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(final_output_data, f, ensure_ascii=False, indent=2)

    total_time = time.time() - total_start

    print("\n" + "-" * 45)
    print(f"{'Platform':<15} | {'Status':<10} | {'Count'}")
    print("-" * 45)
    for plat, status, count in summary:
        print(f"{plat:<15} | {status:<10} | {count}")
    print("-" * 45)
    print(f"Total: {total_projects} items in {total_time:.1f}s")
    print(f"Database: {db_result['inserted_new']} inserted, {db_result['duplicates_skipped']} skipped")
    if args.output:
        print(f"Saved: {os.path.abspath(args.output)}")


if __name__ == "__main__":
    main()
