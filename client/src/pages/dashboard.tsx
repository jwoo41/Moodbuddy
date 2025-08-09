import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pen } from "lucide-react";
import MoodModal from "@/components/mood/mood-modal";
import SleepChart from "@/components/sleep/sleep-chart";
import MedicationCard from "@/components/medication/medication-card";
import JournalEntryComponent from "@/components/journal/journal-entry";
import { MoodEntry, SleepEntry, Medication, MedicationTaken, JournalEntry } from "@shared/schema";

const moodEmojis = {
  "very-sad": "😢",
  "sad": "😞",
  "neutral": "😐",
  "happy": "😊",
  "very-happy": "😄",
};

const moodLabels = {
  "very-sad": "Very Sad",
  "sad": "Sad",
  "neutral": "Neutral",
  "happy": "Happy",
  "very-happy": "Very Happy",
};

export default function Dashboard() {
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  const { data: moodEntries = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/mood"],
  });

  const { data: sleepEntries = [] } = useQuery<SleepEntry[]>({
    queryKey: ["/api/sleep"],
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const { data: medicationTaken = [] } = useQuery<MedicationTaken[]>({
    queryKey: ["/api/medications/taken"],
  });

  const { data: journalEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const todaysMood = moodEntries.find((entry) => {
    const today = new Date().toDateString();
    return new Date(entry.createdAt).toDateString() === today;
  });

  const lastNightSleep = sleepEntries[0];
  const weeklyAverage = sleepEntries.slice(0, 7).reduce((sum, entry) => sum + entry.hoursSlept, 0) / Math.min(sleepEntries.length, 7);

  const getWeeklyMoodData = () => {
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayEntry = moodEntries.find(entry => 
        new Date(entry.createdAt).toDateString() === date.toDateString()
      );
      weekData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        mood: dayEntry ? moodEmojis[dayEntry.mood as keyof typeof moodEmojis] : null,
        isToday: i === 0,
      });
    }
    return weekData;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-mindflow-neutral-900 dark:text-foreground mb-2">
          Good morning, Sarah! 🌅
        </h2>
        <p className="text-mindflow-neutral-500 dark:text-muted-foreground">
          Take a moment to check in with yourself today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => setIsMoodModalOpen(true)}
          className="bg-white dark:bg-card p-4 h-auto rounded-xl shadow-sm border border-mindflow-neutral-100 dark:border-border hover:shadow-md transition-all group flex-col"
          data-testid="button-log-mood"
        >
          <div className="text-2xl mb-2">😊</div>
          <div className="text-sm font-medium text-mindflow-neutral-700 dark:text-foreground group-hover:text-primary">
            Log Mood
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="bg-white dark:bg-card p-4 h-auto rounded-xl shadow-sm border border-mindflow-neutral-100 dark:border-border hover:shadow-md transition-all group flex-col"
          data-testid="button-sleep-log"
        >
          <div className="text-2xl mb-2">😴</div>
          <div className="text-sm font-medium text-mindflow-neutral-700 dark:text-foreground group-hover:text-primary">
            Sleep Log
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="bg-white dark:bg-card p-4 h-auto rounded-xl shadow-sm border border-mindflow-neutral-100 dark:border-border hover:shadow-md transition-all group flex-col"
          data-testid="button-write-journal"
        >
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm font-medium text-mindflow-neutral-700 dark:text-foreground group-hover:text-primary">
            Write
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="bg-white dark:bg-card p-4 h-auto rounded-xl shadow-sm border border-mindflow-neutral-100 dark:border-border hover:shadow-md transition-all group flex-col"
          data-testid="button-view-meds"
        >
          <div className="text-2xl mb-2">💊</div>
          <div className="text-sm font-medium text-mindflow-neutral-700 dark:text-foreground group-hover:text-primary">
            Meds
          </div>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Mood */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground">
                  Today's Mood
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMoodModalOpen(true)}
                  className="text-sm text-primary hover:text-primary/80"
                  data-testid="button-edit-mood"
                >
                  Edit
                </Button>
              </div>
              
              {todaysMood ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {moodEmojis[todaysMood.mood as keyof typeof moodEmojis]}
                  </div>
                  <p className="text-center text-sm text-mindflow-neutral-500 dark:text-muted-foreground">
                    You're feeling{" "}
                    <span className="font-medium text-primary" data-testid="current-mood-label">
                      {moodLabels[todaysMood.mood as keyof typeof moodLabels]}
                    </span>{" "}
                    today
                  </p>
                  {todaysMood.notes && (
                    <p className="mt-2 text-sm text-mindflow-neutral-600 dark:text-muted-foreground italic">
                      "{todaysMood.notes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl text-mindflow-neutral-300 dark:text-muted-foreground mb-2">😊</div>
                  <p className="text-mindflow-neutral-500 dark:text-muted-foreground">
                    How are you feeling today?
                  </p>
                  <Button
                    onClick={() => setIsMoodModalOpen(true)}
                    className="mt-4"
                    data-testid="button-log-first-mood"
                  >
                    Log Your Mood
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sleep Tracking */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground">
                  Sleep Patterns
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary hover:text-primary/80"
                  data-testid="button-add-sleep-entry"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Entry
                </Button>
              </div>
              
              <SleepChart sleepEntries={sleepEntries} />

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground" data-testid="last-night-hours">
                    {lastNightSleep ? `${lastNightSleep.hoursSlept}h` : "--"}
                  </div>
                  <div className="text-xs text-mindflow-neutral-500 dark:text-muted-foreground">Last Night</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground" data-testid="weekly-average">
                    {weeklyAverage ? `${weeklyAverage.toFixed(1)}h` : "--"}
                  </div>
                  <div className="text-xs text-mindflow-neutral-500 dark:text-muted-foreground">Weekly Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary" data-testid="sleep-quality">
                    {lastNightSleep?.quality || "--"}
                  </div>
                  <div className="text-xs text-mindflow-neutral-500 dark:text-muted-foreground">Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journal Entries */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground">
                  Recent Journal Entries
                </h3>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  data-testid="button-new-journal-entry"
                >
                  <Pen className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>

              {journalEntries.length > 0 ? (
                <div className="space-y-3">
                  {journalEntries.slice(0, 2).map((entry) => (
                    <JournalEntryComponent
                      key={entry.id}
                      entry={entry}
                      onEdit={() => {}}
                    />
                  ))}
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      className="text-sm text-primary hover:text-primary/80 font-medium p-0"
                      data-testid="button-view-all-entries"
                    >
                      View All Entries →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl text-mindflow-neutral-300 dark:text-muted-foreground mb-2">📝</div>
                  <p className="text-mindflow-neutral-500 dark:text-muted-foreground mb-4">
                    No journal entries yet
                  </p>
                  <Button data-testid="button-start-journaling">
                    Start Writing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Medication Reminders */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground">
                  Medication
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary hover:text-primary/80"
                  data-testid="button-manage-medications"
                >
                  Manage
                </Button>
              </div>

              {medications.length > 0 ? (
                <div className="space-y-3">
                  {medications.map((medication) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      takenRecords={medicationTaken.filter(
                        (record) => record.medicationId === medication.id
                      )}
                    />
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4 py-2 border-2 border-dashed border-mindflow-neutral-200 dark:border-border text-sm text-mindflow-neutral-500 dark:text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    data-testid="button-add-medication"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Medication
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-3xl text-mindflow-neutral-300 dark:text-muted-foreground mb-2">💊</div>
                  <p className="text-mindflow-neutral-500 dark:text-muted-foreground mb-4">
                    No medications added
                  </p>
                  <Button data-testid="button-add-first-medication">
                    Add Medication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Mood Trend */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-mindflow-neutral-900 dark:text-foreground mb-4">
                This Week's Mood
              </h3>
              
              <div className="space-y-3">
                {getWeeklyMoodData().map((day, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between ${
                      day.isToday ? "bg-primary/10 px-2 py-1 rounded" : ""
                    }`}
                  >
                    <span className={`text-sm ${
                      day.isToday 
                        ? "font-medium text-primary" 
                        : "text-mindflow-neutral-500 dark:text-muted-foreground"
                    }`}>
                      {day.isToday ? "Today" : day.day}
                    </span>
                    <span className="text-lg">
                      {day.mood || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 text-center">
            <div className="text-2xl mb-3">🌟</div>
            <h4 className="font-semibold text-mindflow-neutral-900 dark:text-foreground mb-2">
              You're doing great!
            </h4>
            <p className="text-sm text-mindflow-neutral-600 dark:text-muted-foreground">
              {moodEntries.length > 0 
                ? `You've logged your mood ${moodEntries.length} time${moodEntries.length === 1 ? '' : 's'}. Keep up the good work!`
                : "Start tracking your mental health journey today."
              }
            </p>
          </div>
        </div>
      </div>

      <MoodModal
        open={isMoodModalOpen}
        onOpenChange={setIsMoodModalOpen}
      />
    </div>
  );
}
