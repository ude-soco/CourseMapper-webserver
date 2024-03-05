from distutils import extension
import io
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import PDFPageAggregator
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
from pdfminer.layout import LTTextBox, LTTextLine, LTChar
from pdfminer.layout import LTFigure, LTAnno
import os
import re
from werkzeug.datastructures import FileStorage

import logging
from log import LOG


logger = LOG(name=__name__, level=logging.DEBUG)


class PDFTextExtractor:
    """ PDF Text Extractor

    """
    def extract_text(self, file, use_most_font_size=False):
        logger.info("Extracting text from file: %s" % file)

        document_text = ""
        font_sizes = {}

        manager = PDFResourceManager()
        aggregator = PDFPageAggregator(manager,
                                       laparams=LAParams(detect_vertical=True))
        interpreter = PDFPageInterpreter(manager, aggregator)

        logger.info("PDF: %s" % extension)

        if use_most_font_size == True:

            for page in PDFPage.get_pages(file, set()):
                interpreter.process_page(page)
                layout = aggregator.get_result()
                self.count_font_sizes(layout._objs, font_sizes)

            most_used_font_size_value = max(font_sizes.values())
            most_used_font_size_keys = [
                k for k, v in font_sizes.items()
                if v == most_used_font_size_value
            ]

            for page in PDFPage.get_pages(file, set()):
                interpreter.process_page(page)
                layout = aggregator.get_result()
                document_text += self.parse_obj(layout._objs,
                                                most_used_font_size_keys)
            aggregator.close()
            file.close()
        else:
            for page in PDFPage.get_pages(file, set()):
                interpreter.process_page(page)
                layout = aggregator.get_result()
                document_text += self.preprocess(
                    self.parse_obj(layout._objs, format==False))

        # preprocessing
        doc = self.preprocess(document_text.strip())

        return doc

    def count_font_sizes(self, objs, font_sizes={}):
        """
            This function counts the occurences of each of font size in the PDF
        """
        for obj in objs:
            if isinstance(obj, LTTextBox):
                for o in obj._objs:
                    if isinstance(o, LTTextLine):
                        text = o.get_text()
                        if text.strip():
                            for c in o._objs:
                                if isinstance(c, LTChar):
                                    if round(c.size, 3) in font_sizes:
                                        font_sizes[round(c.size, 3)] += 1
                                    else:
                                        font_sizes[round(c.size, 3)] = 0
            elif isinstance(obj, LTFigure):
                self.count_font_sizes(obj._objs)
            else:
                pass

    def parse_obj(self, objs, format=False, max_font_size=None):
        """
        Looks for texts with max font size 
        """
        output = ""
        for obj in objs:
            if isinstance(obj, LTTextBox):
                if (format == True):
                    text = re.sub(r'\n{1,}', ' ', obj.get_text()).strip()
                    text = re.sub(r'\t{1,}', ' ', text).strip()
                    text = re.sub(r'\s{1,}', ' ', text).strip()

                    if text[-1] not in ['.', '!', '?', ';', ':']:
                        output += text + ".\n"
                    else:
                        output += text + "\n"

                else:
                    for o in obj._objs:
                        if isinstance(o, LTTextLine):
                            text = o.get_text()
                            temp_text = ""
                            if text.strip():
                                for c in o._objs:
                                    if isinstance(c, LTChar):
                                        if max_font_size != None:
                                            if round(c.size,
                                                     3) in max_font_size:
                                                temp_text += c.get_text()
                                        else:
                                            temp_text += c.get_text()
                                    elif isinstance(c, LTAnno):
                                        temp_text += ' '
                                if temp_text.strip():
                                    output += temp_text
            elif isinstance(obj, LTFigure):
                self.parse_obj(obj._objs, max_font_size)
            else:
                pass
        return output

    """
    """

    def extract_text_on_page(self, file, page_number, use_most_font_size=False):
        logger.info("Extracting text from file: %s, page {}".format(page_number) % file)

        document_text = ""
        font_sizes = {}

        manager = PDFResourceManager()
        aggregator = PDFPageAggregator(manager,
                                       laparams=LAParams(detect_vertical=True))
        interpreter = PDFPageInterpreter(manager, aggregator)

        if use_most_font_size == True:
            #print("Use most font size")

            for page in PDFPage.get_pages(file, set()):
                interpreter.process_page(page)
                layout = aggregator.get_result()
                self.count_font_sizes(layout._objs, font_sizes)

            most_used_font_size_value = max(font_sizes.values())
            most_used_font_size_keys = [
                k for k, v in font_sizes.items()
                if v == most_used_font_size_value
            ]

            for page in PDFPage.get_pages(file, set()):
                interpreter.process_page(page)
                layout = aggregator.get_result()
                document_text += self.parse_obj(layout._objs,
                                           most_used_font_size_keys)
            aggregator.close()
            file.close()
        else:
            count = 0
            #print("Don't use most font size")
            for page in PDFPage.get_pages(file, set()):
                #print("Count: ", count)
                count = count+1
                #print("Count2: ", count)
                if(count != page_number):
                    continue
                else:
                    interpreter.process_page(page)
                    layout = aggregator.get_result()
                    #print("Layout", layout._objs)
                    document_text += self.preprocess(
                        self.parse_obj(layout._objs, format=False))
                    break
        # preprocessing
        doc = self.preprocess(document_text.strip())

        return doc

    def get_pagenumbers(self, file):
        count = 0
        #print("Don't use most font size")
        for page in PDFPage.get_pages(file, set()):
            count = count+1
                
        return count

    def preprocess(self, text: str):
        """
        Remove Links
        Remove Punctuation
        Remove title from text
        Remove Person Names
        Remove Stopwords
        Remove Emails, Tel.Nr, Affiliations
        Remove single characters
        Substituting multiple spaces with single space
        Remove PER, LOC, ORG
        Remove standalone numbers
        Remove person's titles (Prof. Dr.-Ing. Dipl.-Ing.)
        """

        if type(text) is bytes:
            text = text.decode('utf-8', 'ignore')

        if type(text) is str:
            text = text.encode("cp1251",
                               errors='ignore').decode('utf-8', 'ignore')

        text = re.sub(r'\n{1,}', ' ', text)
        text = re.sub(r'\s{1,}', ' ', text)
        text = re.sub(r'\t{1,}', ' ', text)
        # remove html markup
        # text = re.sub("(<.*?>)", "", text)
        #text = re.sub("(<.*?>)", "", text)
        # remove non-ascii and digits
        #text = re.sub("({.*?})", "", text)
        # remove URL
        text = re.sub(
            r'''(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))''',
            "", text)
        return text
