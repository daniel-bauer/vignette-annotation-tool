from django.shortcuts import render_to_response
from django.views.generic import TemplateView
from django.shortcuts import render
from django.template.loader import render_to_string
from models import *
from django.http import HttpResponse
import json
import pprint
import pygraphviz as pgv

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
      json_object = {'name': instance.name, 'word' : instance.word, 'word_position': instance.word_position, 'frame': instance.frame_id, 'frame_name' : frame_name, 'scene': instance.scene_id, 'sentence' : instance.sentence_id, 'corpus' : instance.corpus_id}
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
   frame_relations = FeRelations.objects.filter(parent_frame_id = frame_id,rel_type="ISA")
   inheritance_json = [{'parent_fe':frame_rel.parent_fe_name, 'child_fe':frame_rel.child_fe_name,'frame_rel_id':frame_rel.id} for frame_rel in frame_relations]
   return HttpResponse(json.dumps(inheritance_json))

#creates new instances in the new window that is opened
def create_instances(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   word = request.GET.get('word')
   word_position = request.GET.get('word_position')
   name = request.GET.get('name')
   sentence_id = request.GET.get('sentence_id')
   try:
    Instances.create(name,word,word_position,int(scene_id),int(sentence_id),int(corpus_id))
    response = HttpResponse()
    response.content = "Successfully created instance"
    response.status_code = 200
    return response
   except ValueError as e:
     response = HttpResponse()
     response.content = "Encountered error with " + str(e)
     response.status_code = 500
     return response

def create_graph(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   instances = Instances.objects.filter(scene_id=int(scene_id),corpus_id=int(corpus_id))
   adjacency_list_for_graph = {}
   if 'instance_name' in request.GET:
      current_instance_name = request.GET.get('instance_name').strip()
      adjacency_list_for_graph = get_related_frames_for_selected_instance(current_instance_name,scene_id,corpus_id,adjacency_list_for_graph)
   else:
      current_instance_name = ''
      print "no current instance"

   for instance in instances:
      if instance.name == current_instance_name:
         continue
      constituent_elements = ConstituentElements.objects.filter(parent_instance_id=instance.id)
      for constituent_element in constituent_elements:
         if instance.name not in adjacency_list_for_graph:
            adjacency_list_for_graph[instance.name] = {}
         list_for_instance = adjacency_list_for_graph[instance.name]
         list_for_instance[constituent_element.child_inst_name] = constituent_element.fe_name
   return HttpResponse(json.dumps(adjacency_list_for_graph))
   
def get_related_frames_for_selected_instance(instance_name,scene_id,corpus_id,adjacency_list_for_graph):
   instance = Instances.objects.get(name=instance_name)
   constituent_elements = ConstituentElements.objects.filter(parent_instance_id=instance.id)
      
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
   return adjacency_list_for_graph

def create_frameelements(request):
   frame_name = request.GET.get('frame_name')
   fe_name = request.GET.get('fe_name')
   core_status = request.GET.get('core_status')
   framenet_id = request.GET.get('framenet_id')

   FrameElements.create(frame_name,fe_name,core_status,framenet_id)
   return HttpResponse("SUCCESS")

#to open a new window where the new instance can be created
def new_instances(request):
   scene_id = request.GET.get('scene_id')
   corpus_id = request.GET.get('corpus_id')
   sentence_id = request.GET.get('sentence_id')
   word = request.GET.get('word')
   word_position = request.GET.get('word_position')
   return render_to_response('newInstance.html',{'scene_id':scene_id,'corpus_id':corpus_id,'sentence_id':sentence_id,'word':word,'word_position':word_position})
   
   
class AnnotationToolView(TemplateView):
   template_name ="base.html"
   