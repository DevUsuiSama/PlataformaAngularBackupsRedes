export interface BackupConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;        // "08:00", solo para daily/weekly
  weeklyDay: string;   // "monday"… "sunday", solo para weekly
  monthlyDay: string;  // "1"… "31", solo para monthly
  localFolder: string;
}
