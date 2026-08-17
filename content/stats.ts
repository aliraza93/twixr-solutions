import { site } from "./site";

export type SiteStat = {
  value: string;
  line1: string;
  line2: string | null;
};

export const SITE_STATS: SiteStat[] = [
  { value: `${site.yearsOfExperience}+`, line1: "Years", line2: "Experience" },
  { value: site.proof.jobs, line1: "Jobs", line2: "on Upwork" },
  { value: site.proof.jobSuccess, line1: "Job", line2: "Success" },
  { value: site.proof.earned, line1: "Earned", line2: "on Upwork" },
];
