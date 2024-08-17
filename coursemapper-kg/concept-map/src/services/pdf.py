from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar, LTTextLine, LTCurve, LTRect, LTFigure
from typing import List
import re

class TextSlice:
    def __init__(self, text: str, x: float, y: float):
        self.text = text
        self.cleaned_text = re.sub(r'[^A-Za-z]', '', text)
        self.x = x
        self.y = y

    def __str__(self):
        return f'{self.text} ({self.x}, {self.y})'

    def __eq__(self, other):
        return self.cleaned_text == other.cleaned_text and abs(self.x-other.x) < 5 and abs(self.y-other.y) < 5

    def __hash__(self):
        return hash((self.cleaned_text, int(self.x), int(self.y)))

def extract_text_from_pdf(file) -> List[str]:
    """
    Extracts text from each page of a PDF file.

    Args:
    file_path (str): The file path of the PDF.

    Returns:
    List[str]: A list of strings where each string represents the text of a page.
    """
    page_parts: list[list[TextSlice]] = []

    for page_layout in extract_pages(file):
        last_element = None
        last_size = None
        parts: list[TextSlice] = []
        current_part = ''

        def commit_part(pos: tuple):
            nonlocal parts
            nonlocal current_part
            final_part = current_part.replace('\n', ' ').strip()
            has_letters = any(c.isalpha() for c in final_part)
            if final_part and has_letters:
                parts.append(TextSlice(final_part, pos[0], pos[1]))
            current_part = ''

        def extract_element(element):
            nonlocal current_part
            nonlocal last_size
            nonlocal last_element

            if isinstance(element, LTTextLine) or isinstance(element, LTChar):
                element_text = element.get_text()

                # If the distance between the last element and the current element is greater than 30, commit the previous part
                if last_element is not None:
                    if element.vdistance(last_element) > last_element.height * 1.5 or element.hdistance(last_element) > last_element.width * 1.5:
                        commit_part((last_element.x0, last_element.y0))

                    # If there is a bullet point to the left of the text, commit the previous part
                    for child in page_layout:
                        if isinstance(child, LTCurve) or isinstance(child, LTRect) or isinstance(child, LTFigure):
                            if child.x1 <= element.x0 and child.x0 > element.x0 - 30 and child.y0 >= element.y0 - 0.5 and child.y1 <= element.y1 + 0.5:
                                commit_part((last_element.x0, last_element.y0))
                                break

                    # If element starts with a non-alphanumeric character followed by a space, commit the previous part
                    if element_text and len(element_text) > 2 and not element_text[0].isalnum() and element_text[0] != ' ' and element_text[1] == ' ':
                        commit_part((last_element.x0, last_element.y0))

                    if isinstance(element, LTTextLine):
                        chars = list(element)
                    else:
                        chars = [element]
                    first_char = None
                    for char in chars:
                        if isinstance(char, LTChar):
                            first_char = char
                            break

                    if first_char is not None:
                        if hasattr(chars[0], 'size'):
                            if last_size is not None and abs(last_size - first_char.size) > 0.5:
                                commit_part((last_element.x0, last_element.y0))
                            last_size = first_char.size

                last_element = element
                current_part += element_text
            elif hasattr(element, '_objs'):
                for child in element:
                    extract_element(child)

        for element in page_layout:
            extract_element(element)

        if last_element is not None:
            commit_part((last_element.x0, last_element.y0))

        page_parts.append(parts)

    # Create a frequency dictionary for slices
    slice_freq: dict[TextSlice, int] = {}
    for parts in page_parts:
        for slice in parts:
            if slice in slice_freq:
                slice_freq[slice] += 1
            else:
                slice_freq[slice] = 1

    text_per_page = []
    for parts in page_parts:
        page_text = ''
        for part in parts:
            part_freq = slice_freq[part]

            # Exclude slices that appear on more than min(5, number of pages) pages
            if part_freq > min(5, max(len(page_parts) - 1, 1)):
                continue

            final_part = re.sub(r'\s+', ' ', part.text)
            final_part = re.sub(r'\s\W*\s', ' ', final_part)
            final_part = re.sub(r'^\W\s', '', final_part)
            final_part = re.sub(r'\s\W*$', '', final_part)
            final_part = final_part.strip()
            page_text += final_part + '\n'
        text_per_page.append(page_text)

    return text_per_page
