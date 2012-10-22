"""
Represent a frame or vignette. Supports loading 
"""

import oursql

DB_HOST = 'melcuk.cs.columbia.edu'
DB_USER = 'text2scene'
DB_PASSWORD = 'fj19d'
DB_DATABASE = 'vignet'
DB_PORT = 3306


class FrameRelation(dict):
    """
    Relation between two frames. 
    """
    def __init__(self, parent, child, pairs):
        self.parent = parent 
        self.child = child 
        self.update(dict(pairs))
        
    def __repr__(self):
        map = ", ".join("%s:%s" % (c,p) for (c,p) in self.items())
        return "(%s %s %s {%s})" % (self.__class__.__name__, self.child, self.parent, map) 

class SubFrameRelation(FrameRelation):
    pass

class IsaFrameRelation(FrameRelation):
    pass

class Frame(object):
    """
    A frame.
    """
    def __init__(self, id, name, type, has_lex, framenet_id, timestamp, semiotic_status, annotator):
        self.id = id
        self.name = name 
        self.type = type
        self.has_lexicalization = bool(has_lex) 
        self.framenet_id = 0 
        self.timestamp = timestamp 
        self.semiotic_status = semiotic_status 
        self.annotator = annotator 
        self.fes = {}  #Name to FE objects
        self.parent = None

    def add_fe(self, fe):    
        self.fes[fe.fe_name] = fe

    def __repr__(self):
        fes = ", ".join(self.fes.keys())
        return "(Frame %s (%s)"  % (self.name, fes)
    
class FrameElement(object):
    """
    A single frame element.
    """ 
    def __init__(self, id, frame_id, frame_name, fe_name, core_status, framenet_id):
        self.id =  id 
        self.frame_name = frame_name
        self.frame_id = frame_id 
        self.fe_name = fe_name 
        self.core_status = core_status 
        self.framenet_id = framenet_id 

    def __repr__(self):
        return "(FE %s.%s)" % (self.frame_name, self.fe_name) 

class VigNet(object):
    """
    Database interface for VigNet.
    Allows to access frames lazily, but buffers everything in memory.
    """
    def __init__(self):
        self.connection = None
        self.frames = {}

    def init_db(self, host, user, passwd, database, port=3306):
        self.connection = oursql.connect(host=host, user=user, passwd=passwd, db=database, port=port)

    def load_frame_from_db(self, frame_name):
        """
        Read in a frame from the database.  
        """
        with self.connection as cursor:
            # Load frame declaration
            query = "SELECT * FROM `frames` WHERE `name` = ?;" 
            cursor.execute(query, (frame_name,))
            frame = Frame(*cursor.fetchone())
            cursor.fetchall()
            frame_id = frame.id

            # Load frame elements
            query = "SELECT * FROM `frame_elements` WHERE `frame_id` = ?;"
            cursor.execute(query, (frame_id,))
            for row in cursor:
                frame.add_fe(FrameElement(*row))    

            # Load inheritance information
            # get super-frame
            query = '''SELECT frame_relations.parent_frame_id, frames.name
                FROM frame_relations INNER JOIN frames ON frames.id = frame_relations.parent_frame_id
                WHERE frame_relations.child_frame_id = ? and frame_relations.type = "ISA";'''
            cursor.execute(query, (frame_id,))
            try:
                parent_frame_id, parent_frame_name =  cursor.fetchone()
                cursor.fetchall();   
                # frame element maping
                query = '''SELECT DISTINCT child_fe_name, parent_fe_name
                    FROM fe_relations WHERE parent_frame_id=? AND child_frame_id=? AND fe_relations.type = "ISA"''' 
                cursor.execute(query, (parent_frame_id, frame_id))
                frame.parent = IsaFrameRelation(parent_frame_name, frame_name, cursor)
            except: 
                frame.parent = None 

            # Load decomposition information
            query = '''SELECT frame_relations.child_frame_id, frames.name 
                FROM frame_relations INNER JOIN frames ON frames.id = frame_relations.child_frame_id
                WHERE frame_relations.parent_frame_id = ? AND frame_relations.type = "SUBFRAME";'''
            cursor.execute(query, (frame_id,))    
            frame.decomposition = []
            for child_frame_id, child_frame_name in cursor:
                with self.connection as cursor2:
                    query = '''SELECT DISTINCT parent_fe_name, child_fe_name 
                        FROM fe_relations WHERE parent_frame_id = ? AND child_frame_id=? AND type= "SUBFRAME"''' 
                    cursor2.execute(query, (frame_id, child_frame_id))    
                    relation = SubFrameRelation(child_frame_name, frame_name, cursor2)
                    frame.decomposition.append(relation)

            return frame

    def get_frame(self, frame_name): 
        """
        Return a frame object by name.
        """
        try:
            return self.frames[frame_name]
        except KeyError:
            frame = self.load_frame_from_db(frame_name)
            self.frames[frame_name] = frame
            return frame

if __name__=="__main__":
    vignet = VigNet()
    vignet.init_db(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT)

    frame =  vignet.load_frame_from_db('Use_computer')
    print frame.fes
    print frame.parent
    print frame.decomposition
