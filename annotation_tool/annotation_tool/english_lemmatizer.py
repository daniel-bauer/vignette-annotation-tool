import os
MORPH_TABLE = os.path.join("annotation_tool", "morph_english.roots2infl-corrected-noidents")

class EnglishLemmatizer():
    """
    A simple lemmatizer, that just looks up a form in the table and returns the
    lemma. If no entry is found it returns the input form (this makes sense
    because word forms that are equal to the lemma are not in the table)

    >>> lemmatizer = EnglishLemmatizer()
    >>> lemmatizer.process_word("ate","V")
    'eat'
    >>> lemmatizer.process_word("mice","N")
    'mouse'
    """
    
    __lemmatizerSingleton = None
    
    def __init__(self,morphTableLoc=MORPH_TABLE):

        if EnglishLemmatizer.__lemmatizerSingleton: 
            raise EnglishLemmatizer.__lemmatizerSingleton

        morphTableFile = file(morphTableLoc,"r")

        self.morphTable = {}
        self.pastForms = {}

        line = morphTableFile.readline().strip()
        while line:
            lexInfo, form = line.split("#")
            form = form.strip()
            lexInfoField = lexInfo.split()
            word = lexInfoField[0].strip()
            pos = lexInfoField[1].strip()
            if pos=="V":
                if lexInfoField[2].strip() in ["PAST","PROG","PPART","PRES"]:
                    tense = lexInfoField[2].strip()
                    person = None
                elif len(lexInfoField)>=4:
                    tense = lexInfoField[3].strip()
                    person = lexInfoField[2].strip()
                else:
                    tense = None
                    person = lexInfoField[2]

                if tense == "PAST":
                    self.pastForms[word.strip()] = form

            self.morphTable[(form, pos)] = word.strip()
            line = morphTableFile.readline().strip()

        self.wordLists = {} # Allows to store word lists 
                            # (for example stop words etc.)

        EnglishLemmatizer.__lemmatizerSingleton = self

    @staticmethod
    def getSingleton():
        return EnglishLemmatizer.__lemmatizerSingleton

    def process_word(self, form, pos):
        if (form, pos) in self.morphTable:
            return self.morphTable[(form,pos)]
        else: 
            return form

    def loadWordList(self, name, path):
        """
        Load a word list and store it under the provided Id.
        Word lists contain one lemmatized word per line.
        """
        words = set([w.strip() for w in file(path).readlines()])
        self.wordLists[name] = words

    def loadControlWordList(self, nameSubj, nameObj, path):
        words = [w.strip().split() for w in file(path).readlines()]
        subjectset = set()
        objectset = set()
        for t,w in words: 
            if "S" in t or "A" in t:
                subjectset.add(w.strip())
            else: 
                objectset.add(w.strip())
        self.wordLists[nameSubj] = subjectset
        self.wordLists[nameObj] = objectset

    def isInWordList(self, list, lemma):
        return lemma in self.wordLists[list] 

    def hasWordList(self, name):
        return name in self.wordLists

    def getPast(self, lemma):
        """
        Return the past tense form of a verb. If the verb is not in the dictionary
        use some heuristics for morphographemic changes. 
        """
        if lemma in self.pastForms:
            return self.pastForms[lemma]
        else:
            if lemma.endswith("y"):
                return lemma[:-1]+"ied"
            if lemma.endswith("e"):
                return lemma+"d"
            elif lemma.endswith("ck"):
                return lemma[:-2]+"kked"
            elif len(lemma) > 3 and lemma[-1] in "bdgkmnpstz" and lemma[-1] != lemma[-2] and \
                lemma[-2] in "aeiou" and lemma[-3]!=lemma[-4] and lemma[-4:-2]!="ck":
                return lemma+lemma[-1] + "ed"
            elif len(lemma) <= 3 and lemma[-1] in "bdgkmnpstz" and lemma[-1] != lemma[-2] and \
                lemma[-2] in "aeiou":
                return lemma+lemma[-1] + "ed"
            else:
                return lemma+"ed"


def convert_penn_pos(pos):
    lemmatizer_pos = None
    if pos=="NNP":
        lemmatizer_pos = "PropN"
    elif pos.startswith("J"):
        lemmatizer_pos = "A"
    else:
        lemmatizer_pos = pos[0]

    return lemmatizer_pos

