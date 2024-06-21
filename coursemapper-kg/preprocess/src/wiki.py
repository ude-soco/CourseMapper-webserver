import re
import sys
from typing import List
from html2text import html2text as htt
from html import unescape


def wiki_abstract(wiki: str) -> str:
    """
    Extract the abstract from the wiki markup.
    """
    text = wiki.split('==', 1)[0]
    text = unhtml(text)
    text = unwiki(text)
    text = text.replace('\n', ' ')
    text = text.strip()
    return text


def unwiki(wiki: str) -> str:
    """
    Remove wiki markup from the text.
    """
    out = ''
    open_tags = 0
    open_braces = 0
    open_brackets = 0
    text_in_brackets = ''
    for i in range(0, len(wiki)):
        if wiki[i] == '{':
            open_braces += 1
        elif wiki[i] == '}':
            open_braces -= 1
        elif wiki[i] == '[':
            open_brackets += 1
        elif wiki[i] == ']':
            open_brackets -= 1
        elif wiki[i] == '<':
            open_tags += 1
        elif wiki[i] == '>':
            open_tags -= 1
        elif open_braces == 0 and open_brackets == 2 and open_tags == 0:
            text_in_brackets += wiki[i]
        elif open_braces == 0 and open_brackets == 0 and open_tags == 0:
            if text_in_brackets != '' and not text_in_brackets.startswith('File:') and not text_in_brackets.startswith('Image:'):
                out += text_in_brackets.split('|')[0].split('#')[0]
            text_in_brackets = ''
            out += wiki[i]

    out = out.replace("'''", '')
    out = out.replace("''", '')

    return out


def unhtml(html: str) -> str:
    """
    Remove HTML from the text.
    """
    html = unescape(html)
    html = re.sub(r'(?i)<br[ \\]*?>', '\n', html)
    html = re.sub(r'(?m)<!--.*?--\s*>', '', html)
    html = re.sub(r'(?i)<ref.*?/>', '', html)
    html = re.sub(r'(?i)<ref.*?>.*?<\/ ?ref>', '', html)
    html = re.sub(r'(?m)<.*?>', '', html)
    html = re.sub(r'\n\n', '\n', html)

    return html

def extract_links(text: str) -> List[str]:
    """
    Extract links from the text.
    """
    links = []
    while True:
        link_start = text.find('[[')
        if link_start == -1:
            break
        link_end = text.find(']]', link_start)
        if link_end == -1:
            break
        link = text[link_start+2:link_end]
        if '|' in link:
            link = link.split('|')[1]
        if '#' in link:
            link = link.split('#')[0]
        if not link.startswith('File:') and not link.startswith('Image:') and not link.startswith('Category:'):
            link = link.replace('_', ' ')
            links.append(link)
        text = text[link_start+2:]
    res = []
    res_set = set()
    for link in links:
        link_folded = link.casefold()
        if link_folded not in res_set:
            res.append(link)
            res_set.add(link_folded)
    return res


class WikiRedirect:
    def __init__(self, id: str, title: str, redirect_to: str):
        self.id = id
        self.title = title
        self.redirect_to = redirect_to


class WikiDisambiguation:
    def __init__(self, id: str, title: str, links: List[str]):
        self.id = id
        self.title = title
        self.links = links


class WikiCategory:
    def __init__(self, id: str, title: str, categories: List[str]):
        self.id = id
        self.title = title
        self.categories = categories


class WikiPage:
    def __init__(self, id: str, title: str, abstract: str, categories: List[str] | None, links: List[str] | None = None):
        self.id = id
        self.title = title
        self.abstract = abstract
        self.categories = categories
        self.links = links


def parse_document(text: str) -> WikiRedirect | WikiDisambiguation | WikiCategory | WikiPage | None:
    """
    Parse a document from the wiki markup.
    """
    try:
        namespace = text.split('<ns>')[1].split('</ns>')[0]
        if namespace != '0' and namespace != '14':
            return None

        title = text.split('<title>')[1].split('</title>')[0]
        title = htt(title)
        title = title.strip()

        id = text.split('<id>')[1].split('</id>')[0]

        if '<redirect title="' in text:
            redirect_to = text.split('<redirect title="', 1)[
                1].split('"', 1)[0]
            return WikiRedirect(id, title, redirect_to)

        content = text.split(
            '</text')[0].split('<text')[1].split('>', maxsplit=1)[1]

        if '{{Disambiguation}}' in content or '{{disambiguation}}' in content:
            title = title.replace(' (disambiguation)', '').replace(' (Disambiguation)', '')
            content_without_see_also = content.split('== See also ==', 1)[0].split('==See also==', 1)[0]
            links = extract_links(content_without_see_also)
            return WikiDisambiguation(id, title, links)

        abstract = wiki_abstract(content)

        categories = []
        for line in content.split('\n'):
            if line.strip().startswith('[[Category:'):
                category = line.split('[[', 1)[1].split(']]', 1)[0]
                category = category.split('|')[0]
                categories.append(category)

        if namespace == '14':
            return WikiCategory(id, title, categories)

        content_without_see_also = content.split('== See also ==', 1)[0].split('==See also==', 1)[0]
        links = extract_links(content_without_see_also)
        return WikiPage(id, title, abstract, categories, links)
    except Exception as e:
        print(e)
        return None
