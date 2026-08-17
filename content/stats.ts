import { site } from "./site";

export type SiteStat = {
  value: string;
  line1: string;
  line2: string | null;
};

function proofValue(label: (typeof site.proof)[number]["label"]) {
  return site.proof.find((item) => item.label === label)?.value ?? "";
}

export const SITE_STATS: SiteStat[] = [
  { value: site.yearsExperience, line1: "Years", line2: "Experience" },
  { value: proofValue("Jobs"), line1: "Jobs", line2: "on Upwork" },
  { value: proofValue("Job Success"), line1: "Job", line2: "Success" },
  { value: proofValue("Earned on Upwork"), line1: "Earned", line2: "on Upwork" },
];
