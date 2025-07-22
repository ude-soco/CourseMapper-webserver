from typing import List
from stanfordcorenlp import StanfordCoreNLP


class StanfordCoreNLPTagger:
    """
    StanforCoreNLP tagger
    https://stanfordnlp.github.io/CoreNLP/history.html
    Download the 3.9.1 version
    Arguments:
        tagger_model: the POS tagger 
    """
    def __init__(self, tagger_model: StanfordCoreNLP):
        self.tagger_model = tagger_model

    def get_tokenized_words(self, text: str):
        """
        """
        tokens = []
        tagged_tokens = []
        tokens = self.tagger_model.word_tokenize(text)
        tagged_tokens = self.tagger_model.pos_tag(text)
        return tokens, tagged_tokens

    def get_sentences(self, text: str) -> List[str]:
        """
        """
        sentences = []
        d = self.tagger_model._request('ssplit', text[:100000])
        for s in d['sentences']:
            sent = ""
            for i, token in enumerate(s['tokens']):
                sent += token['before'] + token['originalText']
            sentences.append(sent)

        return sentences

    def close(self):
        """
        """
        self.tagger_model.close()
