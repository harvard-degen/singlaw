"""
Build the BGE-M3 FAISS index from Singapore law PDFs.
Usage: python build_index.py --pdf-dir /path/to/pdfs --output faiss_index_bgem3

Run this once (or when documents change). Saves index in LangChain format
(index.faiss + index.pkl) compatible with retriever.py.
"""
import argparse
import glob
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.vectorstores import FAISS


def build(pdf_dir: str, output: str) -> None:
    pdf_files = glob.glob(os.path.join(pdf_dir, "**/*.pdf"), recursive=True)
    if not pdf_files:
        raise FileNotFoundError(f"No PDFs found in {pdf_dir}")
    print(f"Found {len(pdf_files)} PDFs")

    docs = []
    for path in pdf_files:
        try:
            docs.extend(PyPDFLoader(path).load())
            print(f"  loaded: {os.path.basename(path)}")
        except Exception as e:
            print(f"  SKIP: {os.path.basename(path)} — {e}")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    print(f"Split into {len(chunks)} chunks")

    print("Loading BGE-M3 (downloads ~1.5 GB on first run)...")
    embeddings = HuggingFaceBgeEmbeddings(
        model_name="BAAI/bge-m3",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    print("Building FAISS index...")
    store = FAISS.from_documents(chunks, embeddings)
    store.save_local(output)
    print(f"Saved to {output}/")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--pdf-dir", required=True)
    p.add_argument("--output", default="faiss_index_bgem3")
    args = p.parse_args()
    build(args.pdf_dir, args.output)
