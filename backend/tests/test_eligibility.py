import pytest
from catalog.eligibility import exclusion_reason


@pytest.mark.parametrize("description", [
    "An application for recording field observations",
    "A library for generating diagrams", "Open hardware soil moisture sensor",
    "An app for making interactive tutorials", "A tool to manage curated reading lists",
    "An inference engine for running pretrained models", "游戏：探索森林并解开谜题",
])
def test_builds_remain_eligible(description):
    assert exclusion_reason("Example", description, "https://example.com/build") is None


@pytest.mark.parametrize("name,description", [
    ("thing", "thing"), ("thing", "https://example.com"),
    ("thing", "Profile README"), ("awesome-tools", "Useful tools"),
    ("thing", "A curated list of useful resources"), ("thing", "A tutorial on Python"),
    ("thing", "Starter template for React"), ("thing", "An asset pack for games"),
    ("thing", "A dataset of observations"), ("thing", "A pretrained tabular model for classification"),
    ("thing", "从零入门指南"), ("thing", "An anthology and field guide"),
    ("thing", "A single archive of public exploit PoCs and vulnerability research writeups"),
])
def test_nonbuilds_are_excluded(name, description):
    assert exclusion_reason(name, description, "https://example.com/build")
