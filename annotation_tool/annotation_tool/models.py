from django.db import models

class Corpus(models.Model):
    name = models.CharField(max_length = 100)

    @classmethod
    def create(cls,name):
        corpus = cls(name=name)
        return corpus
    
class Scene(models.Model):
    name = models.CharField(max_length = 100)
    corpus = models.ForeignKey("Corpus")

    @classmethod
    def create(cls,name,corpus):
        scene = cls(name=name,corpus=corpus)
        return scene

    
class Sentence(models.Model):
    text= models.CharField(max_length = 100)
    scene = models.ForeignKey("Scene")
    corpus = models.ForeignKey("Corpus")
    pos = models.CharField(max_length = 100)

    @classmethod
    def create(cls,name,scene,corpus):
       sentence = cls(name=name,scene=scene,corpus=corpus)
       return sentence



class Frames(models.Model):
    name = models.CharField(max_length = 100)
    frame_type = models.CharField(max_length = 10,null=True)
    has_lexicalization = models.IntegerField()
    framenet_id = models.IntegerField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    semiotic_status = models.CharField(max_length = 100,null=True)
    annotator = models.IntegerField(null=True)

    @classmethod
    def create(cls,name,frame_type,has_lexicalization,framenet_id,timestamp,semiotic_status,annotator):
       frame = cls(name=name,frame_type=frame_type,has_lexicalization=has_lexicalization,framenet_id=framenet_id,timestamp=timestamp,semiotic_status=semiotic_status,annotator=annotator)
       frame.save()

class Instances(models.Model):
    name = models.CharField(max_length=100)
    word = models.CharField(max_length=100)
    word_position = models.CharField(max_length=100)
    frame = models.ForeignKey("Frames")
    scene = models.ForeignKey("Scene")
    sentence = models.ForeignKey("Sentence", related_name="sentence1")
    corpus = models.ForeignKey("Corpus")

    @classmethod
    def create(cls,name,word,word_position,scene_id,sentence_id,corpus_id):
        frame = Frames.objects.get(name=name)
        scene = Scene.objects.get(pk=scene_id)
        corpus = Corpus.objects.get(pk=corpus_id)
        sentence = Sentence.objects.get(pk=sentence_id)
        instance = cls(name=name,word=word,word_position=word_position,frame=frame,scene=scene,sentence=sentence,corpus=corpus)
        instance.save()
        instance.name = str(instance.id) + '-' +  instance.name
        
        instance.save()

class Lexicalization(models.Model):

    word = models.CharField(max_length=100)
    word_position = models.CharField(max_length=100)
    instance = models.ForeignKey("Instances")
    sentence = models.ForeignKey("Sentence")

    


class FrameElements(models.Model):
    frame = models.ForeignKey("Frames")
    frame_name = models.CharField(max_length=256)
    fe_name = models.CharField(max_length=256)
    core_status = models.CharField(max_length=20)
    framenet_id = models.IntegerField(null=True)

    @classmethod    
    def create(cls,frame_name,fe_name,core_status,framenet_id):
        frame = Frames.objects.get(name=frame_name)
        frame_id = frame.id
        frame_name = frame_name
        fe_name = fe_name
        core_status = core_status
        if(framenet_id != None):
            framenet_id = int(framenet_id)
        frame_element = cls(frame_id=frame_id,frame_name=frame_name,fe_name=fe_name,core_status=core_status,framenet_id=framenet_id)
        frame_element.save()


class FrameRelations(models.Model):
    relation_type = models.CharField(max_length=256)
    parent_frame = models.ForeignKey("Frames", related_name='parent_frame1')
    child_frame = models.ForeignKey("Frames", related_name='child_frame1')
    parent_frame_name = models.CharField(max_length=256)
    child_frame_name = models.CharField(max_length=256)

    @classmethod    
    def create(cls,parent_frame_name,child_frame_name,relation_type):
        parent_frame = Frames.objects.get(name=parent_frame_name)
        child_frame = Frames.objects.get(name=child_frame_name)
        frame_relation = cls(parent_frame=parent_frame,child_frame=child_frame,parent_frame_name=parent_frame_name,child_frame_name=child_frame_name,relation_type=relation_type)
        frame_relation.save()
        

class FeRelations(models.Model):
    rel_type = models.CharField(max_length=256)
    parent_frame = models.ForeignKey("Frames", related_name='parent_frame2')
    child_frame = models.ForeignKey("Frames", related_name='child_frame2')
    parent_fe = models.ForeignKey("FrameElements", related_name='parent_fe')
    child_fe = models.ForeignKey("FrameElements", related_name='child_fe')
    parent_fe_name = models.CharField(max_length=256)
    child_fe_name = models.CharField(max_length=256)

    @classmethod    
    def create(cls,parent_fe_name,child_fe_name,parent_frame_name,child_frame_name,rel_type):
        parent_fe = FrameElements.objects.get(frame_name=parent_frame_name,fe_name=parent_fe_name)
        child_fe = FrameElements.objects.get(frame_name=child_frame_name,fe_name=child_fe_name)
        parent_frame = Frames.objects.get(name=parent_frame_name)
        child_frame = Frames.objects.get(name=child_frame_name)

        frame_relation = cls(parent_fe_name=parent_fe_name,child_fe_name=child_fe_name,parent_fe=parent_fe,child_fe=child_fe,parent_frame=parent_frame,child_frame=child_frame,rel_type=rel_type)

        frame_relation.save()

class ConstituentElements(models.Model):
     parent_instance = models.ForeignKey("Instances", related_name='parent')
     parent_inst_name = models.CharField(max_length=256)
     fe = models.ForeignKey("FrameElements")
     fe_name = models.CharField(max_length=256)
     child_instance = models.ForeignKey("Instances", related_name='child')
     child_inst_name = models.CharField(max_length=256)
     @classmethod    
     def create(cls,parent_inst_id,fe_name,child_inst_id):
        parent_instance = Instances.objects.get(id=parent_inst_id)
        parent_inst_name = parent_instance.name
        fe_name = fe_name
        fe = Frames.objects.get(name=frame_name)
        child_instance = Instances.objects.get(id=child_inst_id)
        child_inst_name = child_instance.name
        constituent_element = cls(parent_instance=parent_instance,parent_inst_name=parent_inst_name,fe_name=fe_name,fe=fe,child_instance=child_instance,child_inst_name=child_inst_name)

class FrameKeyword(models.Model):
    frame = models.ForeignKey("Frames", related_name="framekeyword")
    frame_name = models.CharField(max_length=100)
    keyword = models.CharField(max_length=11)
    relation = models.CharField(max_length=11)
    lex_unit = models.ForeignKey("LexicalUnit", related_name="keyword")
    lex_unit_word = models.CharField(max_length=20)
    
    @classmethod
    def create(cls, frame_name, keyword, relation, lex_unit_word):
        frame = Frames.objects.get(name=frame_name)
        frame_name = frame_name
        keyword = keyword
        relation = relation
        lex_unit = LexUnits.objects.get(frame_name=frame_name, word=lex_unit_word)
        lex_unit_word = lex_unit_word
        framekeyword = cls(frame=frame,frame_name=frame_name,keyword=keyword,relation=relation,lex_unit=lex_unit,lex_unit_word=lex_unit_word)
#        framekeyword.save()

class LexicalUnit(models.Model):
    frame = models.ForeignKey("Frames", related_name="lexicalunit")
    frame_name = models.CharField(max_length=100)
    word = models.CharField(max_length=20)
    multiword = models.BooleanField()
    continuous = models.BooleanField()

    @classmethod
    def create(cls, frame_name, word, multiword, continuous):
        frame = Frames.objects.get(name=frame_name)
        frame_name = frame_name
        word = word
        multiword = multiword
        continuous = continuous
        lexicalunit = cls(frame=frame,frame_name=frame_name,word=word,multiword=multiword,continuous=continuous)
#        lexicalunit.save()
