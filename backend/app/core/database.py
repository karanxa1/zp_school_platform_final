from firebase_admin import firestore

def get_db():
    """
    Returns a Firestore database client instance.
    """
    return firestore.client()
