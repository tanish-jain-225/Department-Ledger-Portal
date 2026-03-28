import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Layout, ACCESS, IdentityCardPopup, FacultyProfile } from "@/components";
import { ProfileInfoSection, ReadinessInsight, StudentLedger } from "@/components/profile";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { listByStudent } from "@/lib/data";
import { isStaff } from "@/lib/roles";
import { ProfileSkeleton } from "@/components/ui";

const TABS = [
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    ),
  },
  {
    id: "records",
    label: "Student Records",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "intelligence",
    label: "Career Pulse",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { tab = "profile" } = router.query;
  const setTab = (t) => router.push(`/profile?tab=${t}`, undefined, { shallow: true });
  const [showCard, setShowCard] = useState(false);

  const [academic, setAcademic] = useState([]);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  const loadLists = useCallback(async () => {
    if (!user?.uid) return;
    const uid = user.uid;
    try {
      const [a, act, ach, pl, prj, sk] = await Promise.all([
        listByStudent("academicRecords", uid),
        listByStudent("activities", uid),
        listByStudent("achievements", uid),
        listByStudent("placements", uid),
        listByStudent("projects", uid),
        listByStudent("skills", uid),
      ]);
      setAcademic(a.sort((x, y) => {
        if (y.year !== x.year) return parseInt(y.year) - parseInt(x.year);
        return parseInt(y.semester) - parseInt(x.semester);
      }));
      setActivities(act);
      setAchievements(ach);
      setPlacements(pl);
      setProjects(prj);
      setSkills(sk);
      setListsLoaded(true);
    } catch (e) {
      // Profile lists load failure is non-critical — page still renders
    }
  }, [user?.uid]);

  // Only load ledger data when records or intelligence tab is first opened
  useEffect(() => {
    if (!listsLoaded && (tab === "records" || tab === "intelligence")) {
      loadLists();
    }
  }, [tab, listsLoaded, loadLists]);

  if (loading) {
    return (
      <Layout title="My Profile" access={ACCESS.AUTH}>
        <div className="max-w-4xl mx-auto py-10 px-4">
          <ProfileSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile" access={ACCESS.AUTH}>
      {isStaff(profile?.role) ? (
        <FacultyProfile profile={profile} onRefresh={refreshProfile} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Content Area */}
            <main className="flex-1 min-w-0">
              {tab === "profile" && (
                <ProfileInfoSection 
                  user={user} 
                  profile={profile} 
                  refreshProfile={refreshProfile} 
                  onViewCard={() => setShowCard(true)}
                />
              )}
              {tab === "records" && (
                <StudentLedger 
                  uid={user?.uid} 
                  data={{ academic, activities, achievements, placements, projects, skills }} 
                  onRefresh={loadLists} 
                />
              )}
              {tab === "intelligence" && (
                <ReadinessInsight
                  profile={profile}
                  academic={academic}
                  activities={activities}
                  achievements={achievements}
                  placements={placements}
                  projects={projects}
                  skills={skills}
                />
              )}
            </main>
          </div>

          <IdentityCardPopup
            show={showCard}
            onClose={() => setShowCard(false)}
            role="student"
            data={profile}
            academic={academic}
            activities={activities}
            achievements={achievements}
            placements={placements}
          />
        </div>
      )}
    </Layout>
  );
}
