import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlineChip, HiOutlineChevronRight, HiOutlineCube, HiOutlineDocumentDownload } from "react-icons/hi";
import { projectsAPI } from "../api/projects";
import { AuthContext } from "../context/AuthContext";
import { formatINRFromPaise } from "../utils/price";

const STEPS = [
  {
    icon: HiOutlineChip,
    title: "Pick a project",
    body: "Choose 'Build for me' — we assemble, program and test the working hardware.",
  },
  {
    icon: HiOutlineCube,
    title: "Pay 40% — we start building",
    body: "Your advance orders the components. 30% in 7 days, final 30% only when it's ready.",
  },
  {
    icon: HiOutlineDocumentDownload,
    title: "Collect at VIT-AP",
    body: "We hand over the tested build at VIT-AP University within 25 days — with a demo.",
  },
];

/**
 * order.inovitaz.in — the complete-build storefront.
 * Cards are live from the same catalog as the main site (any admin edit shows
 * up here with no code change). Two prices per project: complete build vs DIY
 * bundle. 4-column grid on wide screens.
 */
export default function OrderHome() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await projectsAPI.getAll({ limit: 60, sort: "popular" });
      if (cancelled) return;
      const list = res?.data?.projects || [];
      setProjects(list.filter((p) => p.status === "active"));
      setLoading(false);
      if (!res?.success && list.length === 0) setError("Could not load the catalog right now.");
    })();
    return () => { cancelled = true; };
  }, []);

  const buildable = useMemo(() => projects, [projects]);

  const orderBuild = (project) => {
    if (!user) {
      toast("Log in to place a build order — your payments and tracking stay in one place.", { icon: "🔐" });
      navigate("/login");
      return;
    }
    navigate(`/order/${project.id}`);
  };

  const buyBundle = (project) => {
    // DIY bundle -> main-site purchase flow (docs + downloads)
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-surface-lowest">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center">
        <span className="badge badge-primary mb-4 inline-flex">Built For You — VIT-AP</span>
        <h1 className="t-h1 text-white mb-4">
          We build the project.
          <br />
          <span className="text-primary">You demo it like a pro.</span>
        </h1>
        <p className="t-body text-outline max-w-2xl mx-auto mb-8">
          Choose any project and we assemble, program, test and hand over the working hardware at
          VIT-AP University. Pay 40% to start, the rest as it progresses.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a href="#buildable" className="btn btn-primary min-h-11 inline-flex items-center gap-2">
            Choose your project <HiOutlineChevronRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <Link to="/track" className="btn btn-secondary min-h-11 inline-flex items-center">
            Track my order
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="bg-surface border border-surface-variant rounded-2xl p-6">
              <step.icon className="w-8 h-8 text-primary mb-3" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wide text-outline mb-1">Step {i + 1}</p>
              <h3 className="text-white font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-outline">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog — 4-column grid, live from the DB */}
      <div id="buildable" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="t-h2 text-white mb-2">Pick the project we should build</h2>
        <p className="text-sm text-outline mb-6">
          Live from the InovitaZ catalog — admin changes appear here automatically.
        </p>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-surface border border-surface-variant rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="bg-surface border border-surface-variant rounded-2xl p-8 text-center">
            <p className="text-outline">{error}</p>
          </div>
        )}

        {!loading && !error && buildable.length === 0 && (
          <div className="bg-surface border border-surface-variant rounded-2xl p-8 text-center">
            <p className="text-outline">No projects available for builds right now — check back soon.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {buildable.map((project) => (
            <article
              key={project.id}
              className="bg-surface border border-surface-variant rounded-2xl overflow-hidden flex flex-col hover:border-primary/60 transition-colors"
            >
              {project.thumbnail && (
                <img src={project.thumbnail} alt="" className="w-full h-36 object-cover" loading="lazy" />
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-primary">{project.category}</span>
                  <span className="text-xs text-outline">{project.difficulty}</span>
                </div>
                <h3 className="text-white font-semibold leading-snug text-sm mb-2">{project.title}</h3>

                <div className="mt-auto space-y-3">
                  {/* Complete build price */}
                  <div>
                    {project.build_price > 0 ? (
                      <p className="text-xs text-outline mb-1.5">
                        Complete build{" "}
                        <span className="text-white font-semibold">{formatINRFromPaise(project.build_price)}</span>
                        <span className="block text-primary-dim font-medium">
                          start with {formatINRFromPaise(Math.round(project.build_price * 0.4))} (40%)
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-outline mb-1.5">Complete build — price on request</p>
                    )}
                    <button
                      type="button"
                      onClick={() => orderBuild(project)}
                      disabled={!(project.build_price > 0)}
                      className="btn btn-primary w-full min-h-11 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      Build for me <HiOutlineChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* DIY bundle price */}
                  <div className="pt-3 border-t border-surface-variant">
                    <p className="text-xs text-outline mb-1.5">
                      DIY bundle{" "}
                      <span className="text-white font-semibold">
                        {formatINRFromPaise(project.price)}
                      </span>
                      <span className="block">docs + code, instant download</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => buyBundle(project)}
                      className="btn btn-secondary w-full min-h-11 inline-flex items-center justify-center gap-2 text-sm"
                    >
                      Get the bundle
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
