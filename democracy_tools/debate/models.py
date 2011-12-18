from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    poster = models.ForeignKey(User)
    text = models.TextField()
    votes = models.IntegerField()

class Problem(models.Model):
    id = models.OneToOneField(Post, primary_key=True, related_name='problem_downcast')
    responds = models.ForeignKey('Proposal')

class Proposal(models.Model):
    id = models.OneToOneField(Post, primary_key=True, related_name='proposal_downcast')
    responds = models.ForeignKey(Problem)

class Comment(models.Model):
    id = models.OneToOneField(Post, primary_key=True, related_name='comment_downcast')
    subject = models.ForeignKey(Post)
    
class Vote(models.Model):
    user = models.ForeignKey(User)
    subject = models.ForeignKey(Post)
