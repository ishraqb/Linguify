"""Seed the song catalog so Discovery has content out of the box.

Run once from the backend folder:  python seed_songs.py

For each song it fetches lyrics from LRCLIB and stores the language and
difficulty (songs without lyrics on LRCLIB are simply skipped).
"""

from app import create_app
from services.lyrics_service import get_or_fetch_lyrics

# A small spread of well-known songs across languages and difficulty levels.
SEED_SONGS = [
  ("Despacito", "Luis Fonsi"),
  ("Bailando", "Enrique Iglesias"),
  ("Vivir Mi Vida", "Marc Anthony"),
  ("La Camisa Negra", "Juanes"),
  ("La Vie En Rose", "Edith Piaf"),
  ("Alors on danse", "Stromae"),
  ("Je Veux", "Zaz"),
  ("99 Luftballons", "Nena"),
  ("Auf uns", "Andreas Bourani"),
  ("Volare", "Domenico Modugno"),
  ("Ai Se Eu Te Pego", "Michel Telo"),
  ("Lemon", "Kenshi Yonezu"),
  ("First Love", "Utada Hikaru"),
  ("Spring Day", "BTS"),
  ("Imagine", "John Lennon"),
  ("Let It Be", "The Beatles"),
  ("Shape of You", "Ed Sheeran"),
]


def main():
  app = create_app()
  with app.app_context():
    added = 0
    skipped = 0
    for title, artist in SEED_SONGS:
      try:
        result = get_or_fetch_lyrics(title=title, artist=artist)
      except Exception:
        result = None
      if result:
        added += 1
        print(f"  added: {title} - {artist}")
      else:
        skipped += 1
        print(f"  skipped (no lyrics): {title} - {artist}")
    print(f"\nDone. {added} songs added, {skipped} skipped.")


if __name__ == "__main__":
  main()
