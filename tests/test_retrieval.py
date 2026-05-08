from OnTimePlus.retriever.hybrid import HybridRetriever

retriever = HybridRetriever()

queries = [
    "Red Line delay Boston",
    "rain delay UMass shuttle",
    "how long does it take to get to UMass from Alewife",
]

for query in queries:
    print("\n" + "="*50)
    print(f"Query: {query}\n")

    results = retriever.search(query, top_k=5)

    for i, r in enumerate(results, 1):
        print(f"{i}. [{r.retriever}] Score: {r.score:.4f}")
        print(f"   Type: {r.doc.type}")
        print(f"   ID: {r.doc.id}")
        print(f"   Text: {r.doc.content[:120]}...\n")