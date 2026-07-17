import random

from services.cloze_service import generate_cloze_questions

LYRICS = (
    "I found out that you never really loved me\n"
    "Walking down the empty street alone tonight\n"
    "Dreaming of another sunny morning"
)


# Each question should blank a word out and include that word among the options.
def test_generate_cloze_questions_shape():
    questions = generate_cloze_questions(LYRICS, language="en", rng=random.Random(1))

    assert len(questions) >= 1
    for question in questions:
        assert "____" in question["prompt"]
        assert question["answer"] in question["options"]
        # The blanked word should not still be visible in the prompt.
        assert question["answer"] not in question["prompt"].split()
