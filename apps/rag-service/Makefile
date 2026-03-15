.PHONY: install test lint format typecheck run clean

install:
	pip install -r requirements.txt
	pip install ruff mypy pytest pytest-cov

test:
	pytest

cov:
	pytest --cov --cov-report=term-missing

lint:
	ruff check .

format:
	ruff format .

typecheck:
	mypy app.py retriever.py llm_providers.py prompts.py

run:
	python app.py

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true
