from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    poster = models.User()
    text = models.TextField()

class Problem(models.Model):
    post = models.OneToOneField(Post, primary_key=True)
    proposal = models.ForeignKey('democracy_tools.debate.Proposal')

class Proposal(models.Model):
    post = models.OneToOneField(Post, primary_key=True)
    problem = models.ForeignKey(Problem)

class Comment(models.Model):
    post = models.OneToOneField(Post, primary_key=True)
    subject = models.Post(Post)

    
