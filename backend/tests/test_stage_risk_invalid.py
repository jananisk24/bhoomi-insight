import pytest

from stage_risk import risk_category


@pytest.mark.parametrize("score", [float("nan"), float("inf"), float("-inf")])
def test_risk_category_rejects_non_finite_scores(score):
    with pytest.raises(ValueError, match="finite"):
        risk_category(score)
