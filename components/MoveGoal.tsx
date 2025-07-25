"use client";

import { useState } from "react";

export default function MoveGoal() {
  const [goal, setGoal] = useState(350);

  return (
    <div className="p-4 border rounded-2xl shadow-sm bg-white dark:bg-black">
      <h3 className="text-sm font-medium mb-2">Move Goal</h3>
      <p className="text-xs text-muted-foreground">Set your daily activity goal.</p>
      <div className="flex items-center justify-center my-4 space-x-4">
        <button onClick={() => setGoal(goal - 10)} className="w-8 h-8 rounded-full border">–</button>
        <span className="text-2xl font-bold">{goal} CALORIES/DAY</span>
        <button onClick={() => setGoal(goal + 10)} className="w-8 h-8 rounded-full border">+</button>
      </div>
      <button className="w-full py-2 mt-2 text-sm font-medium bg-muted rounded-lg">Set Goal</button>
    </div>
  );
}
