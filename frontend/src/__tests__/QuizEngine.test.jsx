import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizEngine from '../pages/QuizEngine';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/client';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the API
vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe('QuizEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders quiz title and timer', async () => {
    // Mock API responses
    api.get.mockResolvedValueOnce({ data: { title: 'Test Quiz', time_limit_minutes: 10 } });
    api.post.mockResolvedValueOnce({ 
      data: { 
        attempt_id: 1, 
        questions: [{ 
          question_id: 1, 
          question_text: 'Test question?', 
          options: ['A', 'B', 'C', 'D'], 
          correct_answer: 'A',
          explanation: 'This is A'
        }], 
        current_difficulty: 0.5 
      } 
    });

    // Render with router
    render(
      <MemoryRouter initialEntries={['/courses/1/quizzes/2']}>
        <QuizEngine quizId="2" courseId="1" />
      </MemoryRouter>
    );

    // Wait for loading to complete
    expect(await screen.findByText(/Test Quiz/i)).toBeInTheDocument();
    expect(screen.getByText(/Time Left:/i)).toBeInTheDocument();
  });

  test('allows selecting and submitting an answer', async () => {
    // Mock API responses
    api.get.mockResolvedValueOnce({ data: { title: 'Test Quiz', time_limit_minutes: 10 } });
    api.post.mockResolvedValueOnce({ 
      data: { 
        attempt_id: 1, 
        questions: [{ 
          question_id: 1, 
          question_text: 'Test question?', 
          options: ['A', 'B', 'C', 'D'], 
          correct_answer: 'A',
          explanation: 'This is A'
        }], 
        current_difficulty: 0.5 
      } 
    });
    api.post.mockResolvedValueOnce({ 
      data: { 
        question: null, 
        is_complete: true, 
        score: 1, 
        max_score: 1, 
        time_taken: 30 
      } 
    });

    // Render with router
    render(
      <MemoryRouter initialEntries={['/courses/1/quizzes/2']}>
        <QuizEngine quizId="2" courseId="1" />
      </MemoryRouter>
    );

    // Wait for question to load
    const question = await screen.findByText(/Test question\?/i);
    expect(question).toBeInTheDocument();

    // Select an answer
    const optionA = screen.getByRole('button', { name: /A/i });
    await userEvent.click(optionA);

    // Submit answer
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    await userEvent.click(submitButton);

    // Wait for completion
    expect(await screen.findByText(/Quiz Complete!/i)).toBeInTheDocument();
    expect(screen.getByText(/Score: 1 \/ 1/i)).toBeInTheDocument();
  });
});