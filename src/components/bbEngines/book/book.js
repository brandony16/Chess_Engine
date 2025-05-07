let openingBook = null;

export async function getBook() {
  if (!openingBook) {
    const res = await fetch('/book.bin');
    if (!res.ok) {
      throw new Error("Failed to load book.bin");
    }
    console.log(res);
    openingBook = await res.json();
  }
  return openingBook;
}