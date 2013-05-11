from django.shortcuts import render_to_response
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from django.shortcuts import render
from django.template.loader import render_to_string
from models import *
from django.http import HttpResponse
from django.core import serializers
import json
import pprint
import pygraphviz as pgv
from english_lemmatizer import EnglishLemmatizer
from subprocess import check_call
import time
from datetime import datetime, date, time
import os

lemmatizer = EnglishLemmatizer()
lemmaTypes = ['N', 'V', 'A', 'Adv']

def get_lexicalization(request):
    print 'come into lexicalization'
    
    instance_id=request.GET.get('instance_id')
    print instance_id
    print 'before get'
    lexical_sets=Lexicalization.objects.filter(id=int(instance_id))
    print lexical_sets
    print '11'
    lexical_jason=[]
    for lexical in lexical_sets:
        json_object = {'id': lexical.id, 'instance_id': lexical.instance_id,'word':lexical.word,'word_position':lexical.word_position, 'sentence_id':lexical.sentence_id}
        lexical_jason.append(json_object)
    print lexical_jason
    print 'lexical end'
    return HttpResponse(json.dumps({"lexicalizations":lexical_jason}))

def get_sentences(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   sentences = Sentence.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id))
   text = ""
   for sentence in sentences:
      text += '<tr><td>' + sentence.text + '</td></tr>'
   return HttpResponse(text)

def get_instances(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id))
   instance_json = []
   for instance in instances:
# TODO: check if frame exists      
      frame_name = Frames.objects.get(pk=instance.frame_id).name
      json_object = {'name': instance.name, 'word' : instance.word, 'word_position': instance.word_position, 'frame': instance.frame_id, 'frame_name' : frame_name, 'scene': instance.scene_id, 'sentence' : instance.sentence_id, 'corpus' : instance.corpus_id, 'instance_id':instance.id}
      instance_json.append(json_object)
   return HttpResponse(json.dumps({"instances":instance_json}))

def get_frameelements(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instance_name = request.GET.get('instance_name')
   instance = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id),name=instance_name)[0]
   frame = Frames.objects.get(pk=instance.frame_id)
   frame_elements = FrameElements.objects.filter(frame_id=frame.id)
   frame_elements_json = [{'name': instance.name, 'word' : instance.word, 'word_position': instance.word_position, 'frame': instance.frame_id, 'frame_name' : frame_name, 'scene': instance.scene_id, 'sentence' : instance.sentence_id, 'corpus' : instance.corpus_id} for frame_element in frame_elements]
   return HttpResponse(json.dumps({"frame_elements":frame_elements_json}))


def get_frames(request):
   frames = Frames.objects.all()
   frames_json = [{'name':frame.name, 'id':frame.id} for frame in frames]
   return HttpResponse(json.dumps(frames_json))

def get_constituentelements(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instance_name = request.GET.get('instance_name')
   instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id),name=instance_name)
   instance = instances[0]
   constituent_elements = ConstituentElements.objects.filter(parent_instance_id=instance.id)
   constituent_elements_json = []
   for constituent_element in constituent_elements:
      json_object = {'parent_inst_id': constituent_element.parent_instance_id, 'parent_inst_name' : constituent_element.parent_inst_name,'child_inst_id': constituent_element.child_instance_id, 'child_inst_name' : constituent_element.child_inst_name,'fe_name':constituent_element.fe_name}
      constituent_elements_json.append(json_object)
   return HttpResponse(json.dumps(constituent_elements_json))


def get_subframes(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instance_name = request.GET.get('instance_name')
   instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id),name=instance_name)
   instance = instances[0]
   frame_id = instance.frame_id
   frame_relations = FeRelations.objects.filter(parent_frame_id = frame_id,rel_type="SUBFRAME")
   subframes_json = {}
   for frame_rel in frame_relations:
      subframe_name = Frames.objects.get(id=frame_rel.child_frame_id).name
      if subframe_name not in subframes_json:
         subframes_json[subframe_name] = []
      subframe_relations = subframes_json[subframe_name]
      subframe_relations.append({'parent_fe':frame_rel.parent_fe_name, 'child_fe':frame_rel.child_fe_name,'frame_rel_id':frame_rel.id})
         
#      subframes_json = [{'parent_fe':frame_rel.parent_fe_name, 'child_fe':frame_rel.child_fe_name,'frame_rel_id':frame_rel.id} for frame_rel in frame_relations]
   return HttpResponse(json.dumps(subframes_json))

def delete_subframes(request):
   frame_rel_id = request.GET.get('frame_rel_id')
   pprint.pprint(frame_rel_id)
   fe_relation_object = FeRelations.objects.get(pk=int(frame_rel_id))
   fe_relation_object.delete()
   return HttpResponse('SUCESS')

def get_inherits_from(request):
    scene_id = request.GET.get('scene_id')
    corpus_id = request.GET.get('corpus_id')
    instance_name = request.GET.get('instance_name')
    instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id),name=instance_name)
    instance = instances[0]
    frame_id = instance.frame_id
    frame_relations = FrameRelations.objects.filter(child_frame_id = frame_id,relation_type="ISA")
    inheritance_json = [{'parent_frame':frame_rel.parent_frame_name, 'child_frame':frame_rel.child_frame_name,'frame_relation_id':frame_rel.id} for frame_rel in frame_relations]
    
    return HttpResponse(json.dumps(inheritance_json))

def get_inherits_element_from(request):
    print 'come into inherits elements'
    scene_id = request.GET.get('scene_id')
    corpus_id = request.GET.get('corpus_id')
    instance_name = request.GET.get('instance_name')
    instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id),name=instance_name)
    instance = instances[0]
    frame_id = instance.frame_id
    frame_relations = FeRelations.objects.filter(child_frame_id = frame_id,rel_type="ISA")
    inheritance_json = [{'parent_fe':frame_rel.parent_fe_name, 'child_fe':frame_rel.child_fe_name,'frame_rel_id':frame_rel.id} for frame_rel in frame_relations]
    print inheritance_json
    return HttpResponse(json.dumps(inheritance_json))

# Creates new instances in the new window that is opened
@ensure_csrf_cookie
def create_instances(request):
    sceneId = request.POST['sceneId']
    corpusId = request.POST['corpusId']
    word = request.POST['word']
    wordPosition = request.POST['wordPosition']
    name = request.POST['name']
    sentenceId = request.POST['sentenceId']
    try:
        Instances.create(name, word, wordPosition, int(sceneId), int(sentenceId), int(corpusId))
        response = HttpResponse()
        response.content = "Successfully created instance"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        response.status_code = 500
        return response

# Creates frame for when user inherits from old frame
@ensure_csrf_cookie
def create_frame(request):
    name = request.POST['name']
    frameType = request.POST['frameType']
    hasLexicalization = request.POST['hasLexicalization']
    try:
        Frames.create(name, frameType, hasLexicalization, None, None, None, None)
        response = HttpResponse()
        response.content = "Successfully created frame"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        response.status_code = 500
        return response

# Creates inheritance relation when user inherints from old frame
@ensure_csrf_cookie
def create_framerelation(request):
    parentFrameName = request.POST['parentFrameName']
    frameName = request.POST['frameName']
    relationType = request.POST['relationType']
    try:
        FrameRelations.create(parentFrameName, frameName, relationType)
        response = HttpResponse()
        response.content = "Successfully created frame relation"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        response.status_code = 500
        return response

# Creates all frame elements for inherited frame
@ensure_csrf_cookie
def create_frameelements(request):
    frameName = request.POST['frameName']
    parentFrameName = request.POST['parentFrameName']
    elements = FrameElements.objects.filter(frame_name = parentFrameName);
    for element in elements:
        try:
            fename = element.fe_name
            FrameElements.create(frameName, fename, element.core_status, None)
            FeRelations.create(fename, fename, parentFrameName, frameName, "ISA")
        except ValueError as e:
            response = HttpResponse()
            response.content = "Encountered error with " + str(e)
            response.status_code = 500
            return response

    response = HttpResponse()
    response.content = "Successfully added frame elements and relations"
    response.status_code = 200
    return response

def create_graph(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id))
   adjacency_list_for_graph = {}
   constituent_instance={}
   if 'instance_name' in request.GET:
      current_instance_name = request.GET.get('instance_name').strip()
      adjacency_list_for_graph, constituent_instance= get_related_frames_for_selected_instance(current_instance_name,scene_id,corpus_id,adjacency_list_for_graph,constituent_instance)
   else:
      current_instance_name = ''
      print "no current instance"
   for instance in instances:
      if instance.name == current_instance_name:
         continue
      constituent_elements = ConstituentElements.objects.filter(parent_instance_id=instance.id)
      count=0
      for constituent_element in constituent_elements:
         count=count+1
         print str(count) + str(instance.name)
         constituent_instance[constituent_element.child_instance_id]=1
         if instance.name not in adjacency_list_for_graph:
            adjacency_list_for_graph[instance.name] = {}
         list_for_instance = adjacency_list_for_graph[instance.name]
         list_for_instance[constituent_element.child_inst_name] = constituent_element.fe_name
      if count==0:
          if  instance.id in constituent_instance or instance.id in adjacency_list_for_graph:
              print 'already add'
          else:
              print 'non-bond instance'+str(instance.name)+' '+str(instance.id)
              adjacency_list_for_graph[instance.name]={}
   a=str(datetime.now())
   a=a.replace(':','')
   filename='graph'+a+'.dot'
   graphname='graph'+a+'.svg'
   f=file(filename, 'w')
   print filename
   print graphname
   a='digraph G {'
   for parentNode in adjacency_list_for_graph:
        adjacencyListForNode = adjacency_list_for_graph[parentNode]
        count=0
        for childNode in adjacencyListForNode:
           a=a+'"'+parentNode+'" ->"'+childNode+'"[label="'+adjacencyListForNode[childNode]+'"];'
           count=count+1
        if count==0:
           print 'graph add one'
           a=a+ '"'+parentNode+'";'

   a=a+'}'
   f.write(a)
   f.close()
   
   check_call(['dot','-Tsvg',filename,'-o',graphname])
   tmp_svg=''
   f=file(graphname,'r')
   for l in f:
        tmp_svg=tmp_svg+l
   os.remove(filename)
   os.remove(graphname)

   return HttpResponse(json.dumps(tmp_svg))
   
def get_related_frames_for_selected_instance(instance_name,scene_id,corpus_id,adjacency_list_for_graph,constituent_instance):
   instance = Instances.objects.get(name=instance_name)
   constituent_elements = ConstituentElements.objects.filter(parent_instance_id=instance.id)
    
   for c_e in constituent_elements:
       constituent_instance[c_e.child_instance_id]=1
    
   frame_relations = FrameRelations.objects.filter(parent_frame_id=instance.frame_id)
   adj_list_for_instance = {}
   for frame_relation in frame_relations:
      adjacency_list_for_subframe = {}
      fe_relations_for_subframe = FeRelations.objects.filter(parent_frame_id=frame_relation.parent_frame_id,child_frame_id=frame_relation.child_frame_id)
      for fe_rel in fe_relations_for_subframe:
         original_relation = ConstituentElements.objects.get(parent_instance_id=instance.id, fe_name = fe_rel.parent_fe_name)
         adjacency_list_for_subframe[original_relation.child_inst_name] = fe_rel.child_fe_name
      adjacency_list_for_graph[frame_relation.child_frame_name] = adjacency_list_for_subframe
      adj_list_for_instance[frame_relation.child_frame_name] = 'SUBFRAME'
   adjacency_list_for_graph[instance_name] = adj_list_for_instance
   return adjacency_list_for_graph,constituent_instance

# Retrieve frame search data from server
def search(searchType, query):
   # TODO:
   # will duplicates be successfully removed?
   querylist = []
   for ltype in lemmaTypes:
       querylist.append(lemmatizer.process_word(query, ltype))

   results = []
   if searchType == 'name':
       for lquery in querylist:
           results += Frames.objects.filter(name__icontains=lquery)
   elif searchType == 'lexicalization':
       for lquery in querylist:
           results += Frames.objects.filter(lexicalunit__word__icontains=lquery)
   elif searchType == 'keyword':
       for lquery in querylist:
           results += Frames.objects.filter(framekeyword__keyword__icontains=lquery)
   elif searchType == 'dobj':
       for lquery in querylist:
           results += Frames.objects.filter(framekeyword__keyword__icontains=lquery, framekeyword__relation='dobj')
   elif searchType == 'nsubj':
       for lquery in querylist:
           results += Frames.objects.filter(framekeyword__keyword__icontains=lquery, framekeyword__relation='nsubj')
   elif searchType == 'prep':
       for lquery in querylist:
           results += Frames.objects.filter(framekeyword__keyword__icontains=lquery, framekeyword__relation='prep')

   return list(set(results))    # delete duplicates

# Open a new window where the new instance can be created
def new_instances(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   sentence_id = request.GET.get('sentence_id')
   word = request.GET.get('word')
   word_position = request.GET.get('word_position')
   searchType = request.GET.get('search-type')
   query = request.GET.get('query')

   results = []
   if(searchType == None or query == ''):
       results = Frames.objects.all()[:100];
   else:
       results = search(searchType, query)

   resultFEs = []
   subframes = []
   parentframes = []
   for result in results:
       fes = FrameElements.objects.filter(frame_name=result.name)
       sfs = Frames.objects.filter(child_frame1__parent_frame_name=result.name, child_frame1__relation_type="SUBFRAME")
       pf = Frames.objects.filter(parent_frame1__child_frame_name=result.name, parent_frame1__relation_type="ISA")

       resultFEs.append(serializers.serialize('json', fes))
       subframes.append(serializers.serialize('json', sfs))
       if(len(pf) != 0):
           parentframes.append(serializers.serialize('json', pf))
       else:
           parentframes.append('')

   results_json = serializers.serialize('json', results)
    
   return render_to_response('newInstance.html',{'scene_id':scene_id,'corpus_id':corpus_id,'sentence_id':sentence_id,'word':word,'word_position':word_position,'results':results_json,'resultFEs':resultFEs,'subframes':subframes,'parentframes':parentframes})

# A new page for editing frames
def frame_editor(request):
    frame_name = request.GET.get('frame_name')
    frame = Frames.objects.get(name=frame_name)

    childframes = Frames.objects.filter(parent_frame1__parent_frame_name=frame_name,
            parent_frame1__relation_type="ISA")
    is_parent = len(childframes) > 0

    inherited_elements = FrameElements.objects.filter(frame_name=frame_name,
            child_fe__rel_type="ISA")

    new_elements = FrameElements.objects.filter(frame_name=frame_name, child_fe=None)

    data = {
            'frame_name': frame_name,
            'is_parent': is_parent,
            'inherited_elements': serializers.serialize('json', inherited_elements),
            'new_elements': serializers.serialize('json', new_elements)
           }

    return render_to_response('frameEditor.html', data)

@ensure_csrf_cookie
def rename_frameelement(request):
    old_name = request.POST.get('old_name')
    new_name = request.POST.get('new_name')
    frame_name = request.POST.get('frame_name')

    if(old_name == 'Self'):
        response = HttpResponse()
        response.status_code = 400
        response.content = "Cannot rename Self frame element"
        return response

    try:
        # Rename frame element
        frame_element = FrameElements.objects.get(frame_name=frame_name, fe_name=old_name)
        frame_element.fe_name = new_name
        frame_element.save()

        # Update parent frame element relations
        parent_relations = FeRelations.objects.filter(parent_fe__frame_name=frame_name,
                parent_fe_name=old_name)
        for relation in parent_relations:
            relation.parent_fe_name = new_name
            relation.save()

        # Update child frame element relations
        child_relations = FeRelations.objects.filter(child_fe__frame_name=frame_name,
                child_fe_name=old_name)
        for relation in child_relations:
            relation.child_fe_name = new_name
            relation.save()

        response = HttpResponse()
        response.content = "Successfully renamed frame element"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        response.status_code = 500
        return response

@ensure_csrf_cookie
def delete_frameelement(request):
    fe_name = request.POST.get('fe_name')
    frame_name = request.POST.get('frame_name')

    if(fe_name == 'Self'):
        response = HttpResponse()
        response.content = "Cannot delete Self frame element"
        response.status_code = 400
        return response

    try:
        # Check if frame element is involved in subframe relation
        parent_subfe = FeRelations.objects.filter(parent_fe__frame_name=frame_name,
                parent_fe_name=fe_name)
        child_subfe = FeRelations.objects.filter(child_fe__frame_name=frame_name,
                child_fe_name=fe_name)

        if(len(parent_subfe) > 0 or len(child_subfe) > 0):
            response = HttpResponse()
            response.content = "Cannot delete frame element in subframe relation"
            response.status_code = 400
            return response

        frame_element = FrameElements.objects.get(fe_name=fe_name, frame_name=frame_name)
        frame_element.delete()

        response = HttpResponse()
        response.content = "Successfully deleted frame element"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        repsonse.status_code = 500
        return response

@ensure_csrf_cookie
def add_frameelement(request):
    fe_name = request.POST.get('fe_name')
    frame_name = request.POST.get('frame_name')

    try:
        # Check if frame already has frame element with same name
        fes_with_name = FrameElements.objects.filter(frame_name=frame_name, fe_name=fe_name)
        if(len(fes_with_name) > 0):
            response = HttpResponse()
            response.status_code = 400
            response.content = "Another frame element already has this name"
            return response

        frame = Frames.objects.get(name=frame_name)
        new = FrameElements(frame=frame, frame_name=frame_name, fe_name = fe_name,
                core_status = "CORE", framenet_id=None)
        new.save()

        response = HttpResponse()
        response.content = "Successfully added frame element"
        response.status_code = 200
        return response
    except ValueError as e:
        response = HttpResponse()
        response.content = "Encountered error with " + str(e)
        response.status_code = 500
        return response

class AnnotationToolView(TemplateView):
   template_name ="base.html"
   
