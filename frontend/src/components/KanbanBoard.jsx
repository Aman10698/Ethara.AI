import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6B7280', bg: '#F3F4F6', dot: '#6B7280' },
  { id: 'in-progress', label: 'In Progress', color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  { id: 'completed', label: 'Completed', color: '#22C55E', bg: '#DCFCE7', dot: '#22C55E' },
  { id: 'overdue', label: 'Overdue', color: '#EF4444', bg: '#FEE2E2', dot: '#EF4444' },
];

const PRIORITY_COLORS = {
  low: { color: '#16A34A', bg: '#DCFCE7' },
  medium: { color: '#D97706', bg: '#FEF3C7' },
  high: { color: '#DC2626', bg: '#FEE2E2' },
  critical: { color: '#7C3AED', bg: '#EDE9FE' },
};

const AVATAR_COLORS = ['#4F6DF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const getColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const TaskCard = ({ task, index, onEdit, onDelete, isAdmin }) => {
  const prio = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="task-card"
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.95 : 1,
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined,
          }}>
          {/* project name and priority */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, background: 'var(--bg-base)', padding: '2px 7px', borderRadius: 4 }}>
              {task.project?.name || 'No Project'}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: prio.bg, color: prio.color }}>
              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
            </span>
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
            {task.title}
          </p>

          {task.description && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
            {/* assigned user */}
            {task.assignedTo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: getColor(task.assignedTo.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                  {task.assignedTo.name?.[0]}
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {task.assignedTo.name?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Unassigned</span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* deadline */}
              {task.deadline && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {format(new Date(task.deadline), 'MMM d')}
                </span>
              )}
              {/* action buttons - admin only */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => onEdit(task)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11 }}
                    className="hover:bg-gray-100 hover:text-blue-500">
                    Edit
                  </button>
                  <button onClick={() => onDelete(task._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px', borderRadius: 4, color: 'var(--text-muted)', fontSize: 11 }}
                    className="hover:bg-red-50 hover:text-red-500">
                    Del
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ col, tasks, onEdit, onDelete, isAdmin, onAddTask }) => (
  <div className="kanban-col">
    <div className="kanban-col-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="dot" style={{ background: col.dot }} />
        <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{col.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: col.bg, color: col.color }}>
          {tasks.length}
        </span>
      </div>
      {isAdmin && onAddTask && (
        <button onClick={onAddTask}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, borderRadius: 4, fontSize: 18, lineHeight: 1 }}
          className="hover:text-blue-500">
          +
        </button>
      )}
    </div>

    <Droppable droppableId={col.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="kanban-col-body"
          style={{
            background: snapshot.isDraggingOver ? `${col.color}06` : undefined,
            borderRadius: '0 0 10px 10px',
            transition: 'background 0.2s',
            minHeight: 240,
          }}>
          {tasks.map((task, i) => (
            <TaskCard key={task._id} task={task} index={i} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} />
          ))}
          {provided.placeholder}
          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
              No tasks here
            </div>
          )}
        </div>
      )}
    </Droppable>
  </div>
);

const KanbanBoard = ({ tasks, onStatusChange, onEditTask, onDeleteTask, isAdmin, onAddTask }) => {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onStatusChange(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            tasks={grouped[col.id] || []}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isAdmin={isAdmin}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
