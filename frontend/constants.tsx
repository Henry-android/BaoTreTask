
import React from 'react';
import { Task } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Phát triển API cho Module Thanh toán',
    assignee: { name: 'Khánh Nguyễn', avatar: 'https://picsum.photos/seed/khanh/100/100' },
    deadline: '2023-12-01',
    status: 'In Progress',
    isOverdue: true,
    priority: 'High'
  },
  {
    id: '2',
    title: 'Thiết kế UI/UX Dashboard mới',
    assignee: { name: 'Minh Trần', avatar: 'https://picsum.photos/seed/minh/100/100' },
    deadline: '2024-05-15',
    status: 'To Do',
    isOverdue: false,
    priority: 'Medium'
  },
  {
    id: '3',
    title: 'Kiểm thử bảo mật Hệ thống',
    assignee: { name: 'Linh Phạm', avatar: 'https://picsum.photos/seed/linh/100/100' },
    deadline: '2023-11-20',
    status: 'In Progress',
    isOverdue: true,
    priority: 'High'
  },
  {
    id: '4',
    title: 'Viết tài liệu hướng dẫn sử dụng',
    assignee: { name: 'Hòa Lê', avatar: 'https://picsum.photos/seed/hoa/100/100' },
    deadline: '2024-06-01',
    status: 'Done',
    isOverdue: false,
    priority: 'Low'
  },
  {
    id: '5',
    title: 'Tối ưu hóa Database Query',
    assignee: { name: 'Anh Vũ', avatar: 'https://picsum.photos/seed/anh/100/100' },
    deadline: '2024-04-10',
    status: 'In Progress',
    isOverdue: false,
    priority: 'High'
  },
  {
    id: '6',
    title: 'Hợp nhất Code và Deploy Staging',
    assignee: { name: 'Đức Đào', avatar: 'https://picsum.photos/seed/duc/100/100' },
    deadline: '2023-10-05',
    status: 'To Do',
    isOverdue: true,
    priority: 'Medium'
  }
];
