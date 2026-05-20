from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import List

from neo4j import GraphDatabase

from config import Config
from app.log import LOG
from .evaluator import ExplanationEvaluator
from .gcn_embedding_engine import GCNEmbeddingEngine

logger = LOG(name=__name__)


def _parse_list(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def main():
    parser = argparse.ArgumentParser(
        description="Run full explanation evaluation on Neo4j"
    )
    parser.add_argument("--uid", required=True, help="User id")
    parser.add_argument("--mid", required=True, help="Material id")
    parser.add_argument(
        "--models",
        default=",".join(GCNEmbeddingEngine.SUPPORTED_TYPES),
        help="Comma-separated model names",
    )
    parser.add_argument(
        "--extract-methods",
        default="method_1,method_2,method_3",
        help="Comma-separated extract methods",
    )
    parser.add_argument(
        "--prune-methods",
        default="method_1,method_2,method_3",
        help="Comma-separated prune methods",
    )
    parser.add_argument(
        "--concept-top-k",
        type=int,
        default=5,
        help="Top-k for concept recommendation",
    )
    parser.add_argument(
        "--sequence-top-k",
        type=int,
        default=10,
        help="Top-k for sequence recommendation",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=5,
        help="Total number of explanation objects sampled for validation per method",
    )
    parser.add_argument(
        "--sample-seed",
        type=int,
        default=42,
        help="Random seed for explanation object sampling",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Optional JSON output path",
    )
    args = parser.parse_args()

    logger.info(
        f"run_full_evaluation start: uid={args.uid}, mid={args.mid}, "
        f"models={args.models}, extract_methods={args.extract_methods}, "
        f"prune_methods={args.prune_methods}, concept_top_k={args.concept_top_k}, "
        f"sequence_top_k={args.sequence_top_k}, sample_size={args.sample_size}, "
        f"sample_seed={args.sample_seed}, output={args.output}"
    )

    models = _parse_list(args.models)
    extract_methods = _parse_list(args.extract_methods)
    prune_methods = _parse_list(args.prune_methods)

    driver = GraphDatabase.driver(
        Config.NEO4J_URI,
        auth=(Config.NEO4J_USER, Config.NEO4J_PASSWORD),
        encrypted=False,
    )

    all_results = []
    try:
        for model in models:
            logger.info(f"start evaluating model={model}")
            evaluator = ExplanationEvaluator(
                driver=driver,
                gcn_type=model,
                sample_size=args.sample_size,
                sample_seed=args.sample_seed,
            )
            try:
                method_results = evaluator.evaluate_all_methods(
                    uid=args.uid,
                    mid=args.mid,
                    concept_top_k=args.concept_top_k,
                    sequence_top_k=args.sequence_top_k,
                    extract_methods=extract_methods,
                    prune_methods=prune_methods,
                )
                logger.info(
                    f"finish evaluating model={model}, num_methods={len(method_results)}"
                )
                all_results.append(
                    {
                        "model": model,
                        "results": method_results,
                    }
                )
            finally:
                evaluator.close()
    finally:
        driver.close()

    printable = []
    for model_entry in all_results:
        model = model_entry["model"]
        print(f"\n=== {model} ===")

        pn_list = []
        ps_list = []
        fns_list = []

        for item in model_entry["results"]:
            method_name = f"{item['extract_method']}+{item['prune_method']}"
            pn_list.append(item["pn"])
            ps_list.append(item["ps"])
            fns_list.append(item["fns"])

            print(
                f"{method_name}: "
                f"PN={item['pn']:.4f}, "
                f"PS={item['ps']:.4f}, "
                f"FNS={item['fns']:.4f}, "
                f"sampled={len(item['sampled_concepts']) + len(item['sampled_sequences'])}"
            )

        print(f"PN list: {pn_list}")
        print(f"PS list: {ps_list}")
        print(f"FNS list: {fns_list}")

        printable.append(
            {
                "model": model,
                "pn_list": pn_list,
                "ps_list": ps_list,
                "fns_list": fns_list,
                "details": model_entry["results"],
            }
        )

    logger.info("all models finished, preparing output")

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(printable, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        logger.info(f"saved JSON results to {output_path}")
        print(f"\nSaved JSON results to {output_path}")


if __name__ == "__main__":
    main()