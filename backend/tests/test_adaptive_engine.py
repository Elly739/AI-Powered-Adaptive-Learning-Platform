import pytest
import sys
import os
from types import SimpleNamespace, MethodType
from unittest.mock import Mock, MagicMock, PropertyMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adaptive_engine import AdaptiveEngine, _mean, _std


def make_answer(question_id=1, is_correct=True, response_time=5.0, topic="test_topic"):
    return SimpleNamespace(
        id=0,
        question_id=question_id,
        is_correct=is_correct,
        response_time=response_time,
        question=SimpleNamespace(id=question_id, topic=topic),
    )


def make_mock_db():
    """Create a mock database session."""
    db = MagicMock()

    db.query = MagicMock(return_value=db)
    db.filter = MagicMock(return_value=db)
    db.order_by = MagicMock(return_value=db)
    db.limit = MagicMock(return_value=db)
    db.first = Mock(return_value=None)
    db.all = Mock(return_value=[])
    db.add = Mock()
    db.flush = Mock()
    db.commit = Mock()
    db.refresh = Mock()

    return db


class TestMeanAndStd:
    def test_mean_empty(self):
        assert _mean([]) == 0.0

    def test_mean_basic(self):
        assert _mean([1, 2, 3]) == 2.0

    def test_std_empty(self):
        assert _std([]) == 0.0

    def test_std_single(self):
        assert _std([5.0]) == 0.0

    def test_std_basic(self):
        assert _std([1, 2, 3, 4, 5]) > 0


class TestAdaptiveDifficulty:
    def setup_method(self):
        self.engine = AdaptiveEngine()

    def test_difficulty_increases_with_accuracy(self):
        answers = [make_answer(is_correct=True, response_time=3.0) for _ in range(5)]
        new_diff = self.engine.calculate_new_difficulty(0.5, answers, {})
        assert new_diff > 0.5

    def test_difficulty_decreases_with_low_accuracy(self):
        answers = [make_answer(is_correct=False, response_time=3.0) for _ in range(5)]
        new_diff = self.engine.calculate_new_difficulty(0.5, answers, {})
        assert new_diff < 0.5

    def test_difficulty_capped_at_0_9(self):
        answers = [make_answer(is_correct=True, response_time=1.0) for _ in range(10)]
        new_diff = self.engine.calculate_new_difficulty(0.85, answers, {})
        assert new_diff <= 0.9

    def test_difficulty_floored_at_0_1(self):
        answers = [make_answer(is_correct=False, response_time=25.0) for _ in range(10)]
        new_diff = self.engine.calculate_new_difficulty(0.2, answers, {})
        assert new_diff >= 0.1

    def test_empty_answers_returns_default(self):
        new_diff = self.engine.calculate_new_difficulty(0.5, [], {})
        assert new_diff == 0.5

    def test_high_accuracy_fast_response_boosts_difficulty(self):
        answers = [make_answer(is_correct=True, response_time=2.0) for _ in range(5)]
        new_diff = self.engine.calculate_new_difficulty(0.5, answers, {})
        assert new_diff > 0.6

    def test_low_accuracy_slow_response_reduces_more(self):
        answers = [make_answer(is_correct=False, response_time=30.0) for _ in range(5)]
        new_diff = self.engine.calculate_new_difficulty(0.5, answers, {})
        assert new_diff < 0.4


class TestLearningStyleDetection:
    def setup_method(self):
        self.engine = AdaptiveEngine()

    def test_too_few_answers_returns_user_preference(self):
        db = make_mock_db()
        user_mock = SimpleNamespace(preferred_style="auditory")
        db.query.return_value.filter.return_value.first.return_value = user_mock

        answers = [make_answer(is_correct=True, response_time=5.0) for _ in range(3)]
        style, confidence = self.engine.detect_learning_style(db, 1, answers)
        assert style.value == "auditory"
        assert confidence == 0.3

    def test_too_few_answers_no_user_returns_visual(self):
        db = make_mock_db()
        db.query.return_value.filter.return_value.first.return_value = None

        answers = [make_answer(is_correct=True, response_time=5.0) for _ in range(3)]
        style, confidence = self.engine.detect_learning_style(db, 1, answers)
        assert style.value == "visual"
        assert confidence == 0.3

    def test_fast_and_accurate_detected_as_reading_writing(self):
        db = make_mock_db()
        db.query.return_value.filter.return_value.first.return_value = None

        answers = [make_answer(is_correct=True, response_time=2.0) for _ in range(10)]
        style, confidence = self.engine.detect_learning_style(db, 1, answers)
        assert style.value == "reading_writing"
        assert confidence > 0.5

    def test_slow_but_accurate_detected_as_auditory(self):
        db = make_mock_db()
        db.query.return_value.filter.return_value.first.return_value = None

        answers = [make_answer(is_correct=True, response_time=15.0) for _ in range(10)]
        style, confidence = self.engine.detect_learning_style(db, 1, answers)
        assert style.value == "auditory"

    def test_inconsistent_timing_detected_as_kinesthetic(self):
        db = make_mock_db()
        db.query.return_value.filter.return_value.first.return_value = None

        answers = [
            make_answer(is_correct=(i % 2 == 0), response_time=(1.0 if i % 2 == 0 else 20.0))
            for i in range(10)
        ]
        style, confidence = self.engine.detect_learning_style(db, 1, answers)
        assert style.value == "kinesthetic"


class TestSpacedRepetition:
    def setup_method(self):
        self.engine = AdaptiveEngine()

    def test_first_repetition_returns_1_day(self):
        assert self.engine.calculate_spaced_repetition_interval(0.5, 2.5, 0) == 1

    def test_second_repetition_returns_6_days(self):
        assert self.engine.calculate_spaced_repetition_interval(0.5, 2.5, 1) == 6

    def test_third_repetition_uses_ease_factor(self):
        result = self.engine.calculate_spaced_repetition_interval(0.5, 2.5, 2)
        assert result == 3

    def test_interval_never_negative(self):
        result = self.engine.calculate_spaced_repetition_interval(0.5, 1.0, 5)
        assert result >= 1


class TestScoreCalculation:
    def test_correct_answer_gets_points(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(
            quiz=SimpleNamespace(questions=[]),
            answers=[
                SimpleNamespace(is_correct=True, question=SimpleNamespace(difficulty_level=0.5)),
                SimpleNamespace(is_correct=False, question=SimpleNamespace(difficulty_level=0.5)),
            ]
        )
        score, max_score = engine.compute_attempt_score(attempt)
        assert score == 1.0
        assert max_score == 2.0

    def test_empty_attempt(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(quiz=SimpleNamespace(questions=[]), answers=[])
        score, max_score = engine.compute_attempt_score(attempt)
        assert score == 0.0
        assert max_score == 0.0

    def test_all_correct(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(
            quiz=SimpleNamespace(questions=[]),
            answers=[
                SimpleNamespace(is_correct=True, question=SimpleNamespace(difficulty_level=0.3)),
                SimpleNamespace(is_correct=True, question=SimpleNamespace(difficulty_level=0.7)),
            ]
        )
        score, max_score = engine.compute_attempt_score(attempt)
        assert score == 2.0
        assert max_score == 2.0


class TestAttemptCompletion:
    def test_complete_when_all_answered(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(
            answers=[
                SimpleNamespace(question_id=1),
                SimpleNamespace(question_id=2),
            ],
            quiz=SimpleNamespace(questions=[SimpleNamespace(id=1), SimpleNamespace(id=2)])
        )
        assert engine.should_complete_attempt(attempt) is True

    def test_incomplete_when_not_all_answered(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(
            answers=[SimpleNamespace(question_id=1)],
            quiz=SimpleNamespace(questions=[SimpleNamespace(id=1), SimpleNamespace(id=2)])
        )
        assert engine.should_complete_attempt(attempt) is False

    def test_empty_quiz(self):
        engine = AdaptiveEngine()
        attempt = SimpleNamespace(answers=[], quiz=SimpleNamespace(questions=[]))
        assert engine.should_complete_attempt(attempt) is False


class TestSelectNextQuestion:
    def setup_method(self):
        self.engine = AdaptiveEngine()

    def test_returns_closest_difficulty(self):
        quiz = SimpleNamespace(questions=[
            SimpleNamespace(id=1, difficulty_level=0.2, topic="a"),
            SimpleNamespace(id=2, difficulty_level=0.8, topic="b"),
            SimpleNamespace(id=3, difficulty_level=0.5, topic="a"),
        ])
        result = self.engine.select_next_question(None, quiz, 0.5, set(), None)
        assert result is not None
        assert result.id == 3

    def test_excludes_answered_questions(self):
        quiz = SimpleNamespace(questions=[
            SimpleNamespace(id=1, difficulty_level=0.2, topic="a"),
            SimpleNamespace(id=2, difficulty_level=0.2, topic="a"),
        ])
        result = self.engine.select_next_question(None, quiz, 0.2, {1}, None)
        assert result is not None
        assert result.id == 2

    def test_returns_none_when_all_answered(self):
        quiz = SimpleNamespace(questions=[
            SimpleNamespace(id=1, difficulty_level=0.2, topic="a"),
        ])
        result = self.engine.select_next_question(None, quiz, 0.2, {1}, None)
        assert result is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
