import React from 'react';
// Faculty Leaderboard page — reuses the student leaderboard via redirect to
// the LeaderboardModal embedded in the dashboard, but as a standalone page
// it renders the full leaderboard table directly.

import FacultyStudentsPage from './FacultyStudentsPage';

// Faculty leaderboard is functionally the same as the students page
// but sorted by score by default and titled "Leaderboard"
export default function FacultyLeaderboardPage() {
  return <FacultyStudentsPage />;
}
