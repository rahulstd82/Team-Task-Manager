import { TaskStatus } from '../api/tasks';

const labels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}
