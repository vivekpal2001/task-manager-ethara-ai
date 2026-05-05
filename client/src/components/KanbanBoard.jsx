import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CheckCircle, Circle, Clock, Edit3, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import './KanbanBoard.css';

const columns = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'DONE', title: 'Done' }
];

export default function KanbanBoard({ tasks, onTaskUpdate, onTaskEdit, onTaskDelete, isAdmin, user }) {
  
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    const newStatus = destination.droppableId;
    
    // Trigger confetti if moved to DONE
    if (newStatus === 'DONE' && task.status !== 'DONE') {
      triggerConfetti();
    }
    
    onTaskUpdate(task, newStatus);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6E56CF', '#00A86B', '#F59E0B']
    });
  };

  const getTasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="kanban-board">
      <DragDropContext onDragEnd={handleDragEnd}>
        {columns.map(col => (
          <div key={col.id} className="kanban-column">
            <div className="kanban-column-header">
              <h3>{col.title} <span className="kanban-count">{getTasksByStatus(col.id).length}</span></h3>
            </div>
            
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  className={`kanban-droppable ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {getTasksByStatus(col.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`task-card card task-priority-${task.priority} ${snapshot.isDragging ? 'is-dragging' : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                            transform: snapshot.isDragging 
                              ? `${provided.draggableProps.style.transform} rotate(-2deg)` 
                              : provided.draggableProps.style.transform
                          }}
                        >
                          <div className="task-card-top">
                            <button
                              className="task-status-btn"
                              onClick={() => {
                                const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
                                if (nextStatus === 'DONE') triggerConfetti();
                                onTaskUpdate(task, nextStatus);
                              }}
                              title="Cycle status"
                            >
                              {task.status === 'DONE'
                                ? <CheckCircle size={20} className="text-green" />
                                : task.status === 'IN_PROGRESS'
                                  ? <Clock size={20} className="text-amber" />
                                  : <Circle size={20} className="text-muted-icon" />
                              }
                            </button>
                            <div className="task-card-info">
                              <span className={`task-title ${task.status === 'DONE' ? 'task-done' : ''}`}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span className="task-description truncate">{task.description}</span>
                              )}
                            </div>
                            <div className="task-card-actions">
                              {(isAdmin || task.assigneeId === user?.id) && (
                                <button className="btn-icon btn-ghost" onClick={() => onTaskEdit(task)}>
                                  <Edit3 size={14} />
                                </button>
                              )}
                              {isAdmin && (
                                <button className="btn-icon btn-ghost" onClick={() => onTaskDelete(task.id)}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="task-card-bottom">
                            <div className="task-tags">
                              <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="task-card-meta">
                              {task.assignee && (
                                <span className="task-assignee">
                                  <span className="mini-avatar">{task.assignee.name.charAt(0)}</span>
                                  {task.assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
}

function getPriorityColor(p) { return p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'amber' : 'green'; }
