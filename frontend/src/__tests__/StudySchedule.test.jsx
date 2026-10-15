import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudySchedule from '../pages/StudySchedule';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the API
vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

describe('StudySchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders schedule tabs and loads data', async () => {
    // Mock API responses
    api.get.mockResolvedValueOnce({ 
      data: [ 
        { 
          id: 1, 
          content_type: 'lesson', 
          recommended_date: '2026-10-15T10:00:00Z',
          scheduled_time_minutes: 30,
          completed: false 
        } 
      ] 
    });
    api.get.mockResolvedValueOnce({ data: [] });

    // Render with router
    render(
      <MemoryRouter initialEntries={['/schedule']}>
        <StudySchedule />
      </MemoryRouter>
    );

    // Wait for loading to complete and schedule to appear
    expect(await screen.findByText(/My Study Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Recommendations/i)).toBeInTheDocument();
  });

  test('can switch between list and calendar view', async () => {
    // Mock API responses
    api.get.mockResolvedValueOnce({ 
      data: [ 
        { 
          id: 1, 
          content_type: 'lesson', 
          recommended_date: '2026-10-15T10:00:00Z',
          scheduled_time_minutes: 30,
          completed: false 
        } 
      ] 
    });
    api.get.mockResolvedValueOnce({ data: [] });

    // Render with router
    render(
      <MemoryRouter initialEntries={['/schedule']}>
        <StudySchedule />
      </MemoryRouter>
    );

    // Initially should be in list view
    expect(screen.getByText(/Upcoming/i)).toBeInTheDocument();
    
    // Click calendar view button
    const calendarButton = screen.getByRole('button', { name: /Calendar View/i });
    await userEvent.click(calendarButton);
    
    // Should now show calendar view elements
    expect(screen.getByText(/October 2026/i)).toBeInTheDocument(); // Current month
    expect(screen.getByText(/Sun/i)).toBeInTheDocument();
    expect(screen.getByText(/Mon/i)).toBeInTheDocument();
    
    // Switch back to list view
    const listButton = screen.getByRole('button', { name: /List View/i });
    await userEvent.click(listButton);
    
    // Should show list view again
    expect(screen.getByText(/Lesson/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete/i)).toBeInTheDocument();
  });
});