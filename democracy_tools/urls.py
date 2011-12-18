from django.conf.urls.defaults import *

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

def jsonwrap(f):
    from django.http import HttpResponse
    import json
    
    def cb(*args, **kwargs):
        datastructure = f(*args, **kwargs)
        return HttpResponse(content=json.dumps(datastructure), mimetype='application/json')
    return cb

urlpatterns = patterns('',
    # Example:
    # (r'^democracy_tools/', include('democracy_tools.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # (r'^admin/', include(admin.site.urls)),
)
