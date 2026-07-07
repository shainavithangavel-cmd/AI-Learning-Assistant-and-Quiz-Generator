import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Collapse, Alert,
  CircularProgress, Chip, Tooltip, Paper, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NoteAddIcon from '@mui/icons-material/NoteAdd';

import useTopicStore from '../stores/useTopicStore';



export default function TopicsAndNotesPage() {
  const {
    topics, notes, loading,
    fetchTopics, createTopic, updateTopic, deleteTopic,
    fetchNotes, addNote, deleteNote
  } = useTopicStore();

  const [expandedTopics, setExpandedTopics] = useState([]);
  const [notesMap, setNotesMap] = useState({});

  const [topicDialog, setTopicDialog] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [noteDialog, setNoteDialog] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [topicForm, setTopicForm] = useState({ title: '', description: '' });
  const [noteText, setNoteText] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleExpandTopic = async (topicId) => {
    if (expandedTopics.includes(topicId)) { 
      setExpandedTopics((prev) => prev.filter((id) => id !== topicId)); //if already expanded remove that topic id
    } else {
      setExpandedTopics((prev) => [...prev, topicId]);
      if (!notesMap[topicId]) {
        try {
          const res = await fetchNotesForTopic(topicId);
          setNotesMap((prev) => ({ ...prev, [topicId]: res }));
        } catch (e) {
          setNotesMap((prev) => ({ ...prev, [topicId]: [] }));
        }
      }
    }
  };

  const fetchNotesForTopic = async (topicId) => {
    await fetchNotes(topicId);
    return notes.filter((n) => n.topic_id === topicId);
  };

  // ── Topic Create / Edit ──────────────────────────────
//to save the topic after filling the form.when clicking create topic inside the dialog
  const handleSaveTopic = async () => {
    setError('');
    if (!topicForm.title.trim()) {
      setError('Title is required');
      return;
    }

    if (editingTopicId) { 
      const result = await updateTopic(editingTopicId, topicForm);
      if (result.success) {
        setTopicDialog(false);
        setTopicForm({ title: '', description: '' });
        setEditingTopicId(null);
        setSuccess('Topic updated!');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(result.error);
      }
    } else {
      const result = await createTopic(topicForm);
      if (result.success) {
        setTopicDialog(false);
        setTopicForm({ title: '', description: '' });
        setSuccess('Topic created!');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(result.error);
      }
    }
  };
//open the edit form.when trainer click edit icon
  const openEditTopic = (topic) => {
    setEditingTopicId(topic.id);
    setTopicForm({ title: topic.title, description: topic.description || '' });
    setError('');
    setTopicDialog(true);
  };

  const handleDeleteTopic = async (id, title) => {
    if (!window.confirm(`Delete topic "${title}"? All notes will also be deleted.`)) return;
    await deleteTopic(id);
    setExpandedTopics((prev) => prev.filter((tid) => tid !== id));
    setNotesMap((prev) => { 
      const copy = { ...prev }; 
      delete copy[id]; //deletes 
      return copy;
    });
  };

  // ── Notes ─────────────────────────────────────────────
//when trainer click save notes after adding
  const handleAddNote = async () => {
    setError('');
    if (!noteText.trim()) {
      setError('Note text cannot be empty');
      return;
    }
    const result = await addNote({ topic_id: selectedTopicId, notes_text: noteText });
    if (result.success) {
      setNoteDialog(false);
      setNoteText(''); //clears note text
      //fetch updated notes for that topic
      await fetchNotes(selectedTopicId);
      setTimeout(() => {
        setNotesMap((prev) => ({
          ...prev,
          [selectedTopicId]: notes.filter((n) => n.topic_id === selectedTopicId),
        }));
      }, 300);
    } else {
      setError(result.error);
    }
  };
//trainer clicks delete note
  const handleDeleteNote = async (noteId, topicId) => {
    await deleteNote(noteId);
    setNotesMap((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).filter((n) => n.id !== noteId),
    }));
  };
//runs when trainer clicks add note
  const openNoteDialog = (topicId) => {
  setSelectedTopicId(topicId);
  setNoteText('');
  setError('');
  setNoteDialog(true);
};
  return (
    <Box className="page-container">
      <Box className="page-header">
        <Box>
          <Typography className="page-title">Topics & Notes</Typography>
          <Typography className="page-subtitle">
            Manage your learning topics and add study notes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setTopicForm({ title: '', description: '' });
            setEditingTopicId(null);
            setError('');
            setTopicDialog(true);
          }}
          sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
        >
          New Topic
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>{success}</Alert>
      )}

      {loading && topics.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {topics.length === 0 && !loading && (
        <Box className="empty-state">
          <Typography sx={{ fontSize: 36 }}>📚</Typography>
          <Typography sx={{ fontWeight: 600, mt: 1 }}>No topics yet</Typography>
          <Typography sx={{ fontSize: 13, mt: 0.5 }}>
            Create your first topic to get started
          </Typography>
        </Box>
      )}

      {topics.map((topic) => {
        const isExpanded = expandedTopics.includes(topic.id);
        const topicNotes = notesMap[topic.id] || [];

        return (
          <Paper
            key={topic.id}
            sx={{
              borderRadius: '12px', mb: 2,
              border: '1px solid #e2e8f0',
              boxShadow: 'none', overflow: 'hidden'
            }}
          >
            {/* Topic header */}
            <Box
              sx={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                p: 2, cursor: 'pointer',
                '&:hover': { backgroundColor: '#f8fafc' },
                backgroundColor: isExpanded ? '#f0f4ff' : 'white',
              }}
              onClick={() => handleExpandTopic(topic.id)}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                  {topic.title}
                </Typography>
                {topic.description && (
                  <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.3 }}>
                    {topic.description}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`Created ${new Date(topic.created_at).toLocaleDateString()}`}
                  size="small"
                  sx={{ fontSize: 11, backgroundColor: '#f1f5f9' }}
                />
                {isExpanded && (
                  <Chip
                    label={`${topicNotes.length} note${topicNotes.length !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                )}

                <Tooltip title="Edit Topic">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); openEditTopic(topic); }}
                    sx={{ color: '#64748b' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Add Note">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); openNoteDialog(topic.id); }}
                    sx={{ color: '#4f46e5' }}
                  >
                    <NoteAddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Topic">
                  <IconButton
                    size="small" color="error"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id, topic.title); }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {isExpanded
                  ? <ExpandLessIcon sx={{ color: '#64748b' }} />
                  : <ExpandMoreIcon sx={{ color: '#64748b' }} />
                }
              </Box>
            </Box>

            {/* Notes section */}
            <Collapse in={isExpanded}>
              <Box sx={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#fafafa', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                    Learning Notes
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<NoteAddIcon />}
                    onClick={() => openNoteDialog(topic.id)}
                    sx={{ textTransform: 'none', fontSize: 12 }}
                  >
                    Add Note
                  </Button>
                </Box>

                {topicNotes.length === 0 && (
                  <Typography sx={{ fontSize: 13, color: '#94a3b8', py: 2, textAlign: 'center' }}>
                    No notes yet. Add notes to generate a quiz later.
                  </Typography>
                )}

                {topicNotes.map((note) => (
                  <Box
                    key={note.id}
                    sx={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      p: 2, mb: 1.5,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {note.notes_text.length > 300
                        ? note.notes_text.slice(0, 300) + '...'
                        : note.notes_text
                      }
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                        Added {new Date(note.created_at).toLocaleDateString()}
                      </Typography>
                      <Tooltip title="Delete note">
                        <IconButton
                          size="small" color="error"
                          onClick={() => handleDeleteNote(note.id, topic.id)}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Paper>
        );
      })}

      {/* Create / Edit Topic Dialog */}
      <Dialog open={topicDialog} onClose={() => setTopicDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTopicId ? 'Edit Topic' : 'Create New Topic'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>
          )}
          <TextField
            label="Topic Title"
            value={topicForm.title}
            fullWidth size="small"
            onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            placeholder="e.g. Introduction to React Hooks"
          />
          <TextField
            label="Description (optional)"
            value={topicForm.description}
            fullWidth size="small" multiline rows={3}
            onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
            placeholder="What does this topic cover?"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTopicDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleSaveTopic}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            {editingTopicId ? 'Save Changes' : 'Create Topic'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Learning Notes</DialogTitle>
        <DialogContent>
  {error && (
    <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>
  )}
  <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1.5, mt: 1 }}>
    Paste your study notes below. These notes will be used by AI to generate quiz questions.
  </Typography>
  <TextField
    value={noteText}
    onChange={(e) => setNoteText(e.target.value)}
    fullWidth multiline rows={10}
    size="small"
    placeholder="Paste your learning notes here..."
  />
</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleAddNote}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}