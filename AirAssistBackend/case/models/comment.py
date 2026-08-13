class CaseComment(models.Model):
    case = models.ForeignKey("case.Case", on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey("user.User", on_delete=models.CASCADE, related_name="case_comments")
    text = models.CharField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment {self.id} on Case {self.case_id} by {self.author.email}"
