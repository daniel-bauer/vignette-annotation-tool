from django.conf.urls import patterns, include, url
from annotation_tool.views import AnnotationToolView
from annotation_tool.views import *
from django.conf import settings

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    (r'^display/$', AnnotationToolView.as_view()),
    (r'^sentences/.*$', get_sentences),
    (r'^instances/.*$', get_instances),
    (r'^lexicalization/.*$', get_lexicalization),
    (r'^frames/.*$', get_frames),
    (r'^subframes/.*$', get_subframes),
    (r'^delete_subframes/.*$', delete_subframes),
    (r'^inherits_from/.*$', get_inherits_from),
    (r'^inherits_element_from/.*$', get_inherits_element_from),
    (r'^graph/.*$', create_graph),
    (r'^constituent_elements/.*$', get_constituentelements),
    (r'^create_instances/.*$', create_instances),
    (r'^create_frame/.*$', create_frame),
    (r'^create_framerelation/.*$', create_framerelation),
    (r'^create_frameelements/.*$', create_frameelements),
    (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT }),
    (r'^new_instances/.*$', new_instances)

    # Examples:
    # url(r'^$', 'myproject.views.home', name='home'),
    # url(r'^myproject/', include('myproject.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
