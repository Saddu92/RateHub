import { useCallback, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { getApiError } from "./api/client";
import "./App.css";

const demo = [
  {
    id: 1,
    name: "Aster & Co.",
    address: "Bandra West, Mumbai",
    overallRating: 4.9,
    totalRatings: 218,
    category: "Lifestyle",
    tint: "violet",
  },
  {
    id: 2,
    name: "Common Ground",
    address: "Indiranagar, Bengaluru",
    overallRating: 4.7,
    totalRatings: 164,
    category: "Food & drink",
    tint: "coral",
  },
  {
    id: 3,
    name: "The Paper Trail",
    address: "Koregaon Park, Pune",
    overallRating: 4.8,
    totalRatings: 92,
    category: "Books & gifts",
    tint: "mint",
  },
  {
    id: 4,
    name: "Harbour House",
    address: "Fort, Mumbai",
    overallRating: 4.6,
    totalRatings: 146,
    category: "Home",
    tint: "blue",
  },
].map((store) => ({ ...store, isDemo: true }));

const getStoreRating = (store) => {
  const value = Number(
    store.overallRating ?? store.rating ?? store.averageRating,
  );
  return Number.isFinite(value) ? value : 0;
};

function Icon({ name, size = 20 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    heart: (
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.5a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    spark: (
      <path d="m12 3-1.8 6.2L4 11l6.2 1.8L12 19l1.8-6.2L20 11l-6.2-1.8L12 3Z" />
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
  };
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Stars({ value, editable = false, onChange }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= Math.round(value) ? "filled" : ""}
          onClick={() => editable && onChange(star)}
          aria-label={`Rate ${star} stars`}
        >
          <Icon name="star" size={editable ? 30 : 15} />
        </button>
      ))}
    </div>
  );
}

function Workspace({ user, onBack, onLogout }) {
  const admin = user.role === "ADMIN";
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    ownerId: "",
    role: "STORE_OWNER",
  });
  const load = useCallback(async () => {
    try {
      if (admin) { 
        const [dashboard, users, stores] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/users", { params: { limit: 100 } }),
          api.get("/admin/stores", { params: { limit: 100 } }),
        ]);
        setData({
          stats: dashboard.data.data,
          users: users.data.data.users,
          stores: stores.data.data.stores,
        });
      } else setData({ stores: (await api.get("/owner/dashboard")).data.data });
    } catch (error) {
      toast.error(getApiError(error, "Could not load workspace."));
    }
  }, [admin]);
  useEffect(() => {
    const refreshId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(refreshId);
  }, [load]);
  const submit = async (event, endpoint, payload, message) => {
    event.preventDefault();
    try {
      const { data: result } = await api.post(endpoint, payload);
      if (endpoint === "/admin/users" && result?.data) {
        setData((current) =>
          current
            ? {
              ...current,
              stats: {
                ...current.stats,
                totalUsers: current.stats.totalUsers + 1,
              },
              users: [result.data, ...current.users],
            }
          : current,
        );
      }
      toast.success(message);
      setForm({ name: "", email: "", address: "", password: "", ownerId: "", role: "STORE_OWNER" });
      await load();
    } catch (error) {
      toast.error(getApiError(error, "Could not save changes."));
    }
  };
  const updateRole = async (userId, role) => {
    try {
      const { data: result } = await api.patch(`/admin/users/${userId}/role`, {
        role,
      });
      setData((current) => ({
        ...current,
        users: current.users.map((account) =>
          account.id === userId ? result.data : account,
        ),
      }));
      toast.success("Role updated.");
    } catch (error) {
      toast.error(getApiError(error, "Could not update the role."));
    }
  };
  const stores = data?.stores || [];
  const listedStores = admin ? [...demo, ...stores] : stores;
  const owners =
    data?.users?.filter((item) => item.role === "STORE_OWNER") || [];
  return (
    <main className="workspace-page">
      <nav className="nav shell">
        <button className="brand" onClick={onBack}>
          <b>✦</b>rate<span>hub</span>
        </button>
        <div className="workspace-actions">
          <span className="role-badge">
            {admin ? "Administrator" : "Store owner"}
          </span>
          <button className="plain" onClick={onBack}>
            View discovery
          </button>
          <button className="button small" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </nav>
      <section className="workspace shell">
        <p className="eyebrow">
          {admin ? "CONTROL CENTRE" : "OWNER WORKSPACE"}
        </p>
        <h1>
          {admin
            ? "Keep your community thriving."
            : "Hello, " + user.name.split(" ")[0] + "."}
        </h1>
        <p className="workspace-lead">
          {admin
            ? "Create owners and places, then test the complete user journey."
            : "See live ratings from the RateHub community."}
        </p>
        {!data ? (
          <div className="workspace-loading">Loading live data…</div>
        ) : (
          <>
            <div className="stat-grid">
              {(admin
                ? [
                    ["People", data.stats.totalUsers],
                    ["Places", data.stats.totalStores],
                    ["Ratings", data.stats.totalRatings],
                  ]
                : [
                    ["Your places", stores.length],
                    [
                      "Total ratings",
                      stores.reduce((sum, item) => sum + item.totalRatings, 0),
                    ],
                    [
                      "Average score",
                      stores.length
                        ? (
                            stores.reduce(
                              (sum, item) => sum + item.averageRating,
                              0,
                            ) / stores.length
                          ).toFixed(1)
                        : "—",
                    ],
                  ]
              ).map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
            {admin && (
              <div className="workspace-grid">
                <section className="panel">
                  <h2>Add a user</h2>
                  <form
                    className="workspace-form"
                    onSubmit={(e) =>
                      submit(
                        e,
                        "/admin/users",
                        { ...form, role: form.role },
                        "User created.",
                      )
                    }
                  >
                    <input
                      required
                      minLength="20"
                      placeholder="Full name (20+ characters)"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="STORE_OWNER">Store owner</option>
                      <option value="USER">Regular user</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                    <input
                      required
                      placeholder="Address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                    <input
                      required
                      type="password"
                      placeholder="Password, e.g. Owner@123"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                    <button className="button">
                      Create user <Icon name="arrow" size={16} />
                    </button>
                  </form>
                </section>
                <section className="panel">
                  <h2>Add a local place</h2>
                  <form
                    className="workspace-form"
                    onSubmit={(e) =>
                      submit(
                        e,
                        "/admin/stores",
                        {
                          name: form.name,
                          email: form.email,
                          address: form.address,
                          ownerId: form.ownerId || null,
                        },
                        "Store created.",
                      )
                    }
                  >
                    <input
                      required
                      placeholder="Store name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                    <input
                      required
                      type="email"
                      placeholder="Store email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                    <input
                      required
                      placeholder="Store address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />
                    <select
                      value={form.ownerId}
                      onChange={(e) =>
                        setForm({ ...form, ownerId: e.target.value })
                      }
                    >
                      <option value="">No owner assigned</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name}
                        </option>
                      ))}
                    </select>
                    <button className="button">
                      Create store <Icon name="arrow" size={16} />
                    </button>
                  </form>
                </section>
              </div>
            )}
            {!admin && (
              <section className="panel owner-create-panel">
                <h2>Add a local place</h2>
                <form
                  className="workspace-form"
                  onSubmit={(e) =>
                    submit(
                      e,
                      "/owner/stores",
                      {
                        name: form.name,
                        email: form.email,
                        address: form.address,
                      },
                      "Store created.",
                    )
                  }
                >
                  <input
                    required
                    placeholder="Store name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Store email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <input
                    required
                    placeholder="Store address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <button className="button">
                    Create store <Icon name="arrow" size={16} />
                  </button>
                </form>
              </section>
            )}
            <section className="panel table-panel">
              <h2>{admin ? "Live places" : "Your stores"}</h2>
              <p>
                {admin
                  ? "Stores visible to signed-in customers."
                  : "Ratings from your customers."}
              </p>
              {listedStores.length ? (
                <div className="data-table">
                  {listedStores.map((store) => (
                    <div key={`${admin ? "demo" : "store"}-${store.id}`}>
                      <strong>{store.name}</strong>
                      <span>{store.address}</span>
                      <span>
                        ★{" "}
                        {getStoreRating(store).toFixed(1)}{" "}
                        · {store.totalRatings} ratings
                      </span>
                      {!admin && (
                        <div className="rating-list">
                          {store.ratings?.length ? (
                            store.ratings.map((rating) => (
                              <span key={rating.id}>
                                {rating.user.name} · {rating.rating}/5
                              </span>
                            ))
                          ) : (
                            <span>No ratings yet.</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <p>No stores are available yet.</p>
                </div>
              )}
            </section>
            {admin && (
              <section className="panel table-panel">
                <h2>People</h2>
                <p>Accounts currently registered on RateHub.</p>
                <div className="data-table">
                  {data.users.map((account) => (
                    <div key={account.id}>
                      <strong>{account.name}</strong>
                      <span>{account.email}</span>
                      <select
                        value={account.role}
                        disabled={account.id === user.id}
                        onChange={(event) =>
                          updateRole(account.id, event.target.value)
                        }
                        aria-label={`Role for ${account.name}`}
                      >
                        <option value="USER">Regular user</option>
                        <option value="STORE_OWNER">Store owner</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </section>
      <ToastContainer position="bottom-right" autoClose={3500} theme="light" />
    </main>
  );
}

function App() {
  const [stores, setStores] = useState(demo);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All places");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [ratingStore, setRatingStore] = useState(null);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("ratehub-user") || "null"),
  );
  const [form, setForm] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [workspace, setWorkspace] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ratehub-token")) return;
    const storesEndpoint = user?.role === "ADMIN" ? "/admin/stores" : "/stores";
    api
      .get(storesEndpoint, { params: { limit: 100 } })
      .then(({ data }) => {
        if (data?.data?.stores) {
          setStores((current) => [
            ...current.filter((store) => store.isDemo),
            ...data.data.stores,
          ]);
        }
      })
      .catch(() => {});
  }, [user, workspace]);

  const visible = useMemo(
    () =>
      stores.filter(
        (s) =>
          `${s.name} ${s.address} ${s.category || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === "All places" || s.category === filter),
      ),
    [stores, query, filter],
  );
  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const payload =
        authMode === "login"
          ? { email: form.email, password: form.password }
          : form;
      const { data: result } = await api.post(`/auth/${endpoint}`, payload);
      if (authMode === "register") {
        setAuthMode("login");
        toast.success("Account created. You can now sign in.");
      } else {
        localStorage.setItem("ratehub-token", result.data.token);
        localStorage.setItem("ratehub-user", JSON.stringify(result.data.user));
        setUser(result.data.user);
        setAuthOpen(false);
        toast.success(`Welcome back, ${result.data.user.name.split(" ")[0]}!`);
      }
    } catch (error) {
      toast.error(getApiError(error, "Unable to complete authentication."));
    } finally {
      setBusy(false);
    }
  }

  async function saveRating() {
    if (!user) {
      setRatingStore(null);
      openAuth();
      return;
    }
    if (!rating) return;
    setBusy(true);
    try {
      const { data: result } = await api.request({
        url: `/stores/${ratingStore.id}/rating`,
        method: ratingStore.userRating ? "patch" : "post",
        data: { rating },
      });
      setStores((all) =>
        all.map((s) =>
          s.id === ratingStore.id && !s.isDemo
            ? { ...s, ...result.data }
            : s,
        ),
      );
      setRatingStore(null);
      toast.success("Your rating has been saved. Thanks for sharing!");
    } catch (error) {
      toast.error(getApiError(error, "Could not save your rating."));
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.patch("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordOpen(false);
      toast.success("Your password has been updated.");
    } catch (error) {
      toast.error(getApiError(error, "Could not update your password."));
    } finally {
      setBusy(false);
    }
  }
  const logout = () => {
    localStorage.removeItem("ratehub-token");
    localStorage.removeItem("ratehub-user");
    setUser(null);
    toast.info("You have been signed out.");
  };
  if (workspace && user && ["ADMIN", "STORE_OWNER"].includes(user.role))
    return (
      <Workspace
        user={user}
        onBack={() => setWorkspace(false)}
        onLogout={logout}
      />
    );

  return (
    <main>
      <nav className="nav shell">
        <button
          className="brand"
          onClick={() => {
            setQuery("");
            setFilter("All places");
          }}
        >
          <b>✦</b>rate<span>hub</span>
        </button>
        <div className="nav-links">
          <a href="#discover">Discover</a>
        </div>
        {user ? (
          <div className="profile">
            <i>{user.name?.[0]}</i>
            <div>
              <strong>{user.name?.split(" ")[0]}</strong>
              <button onClick={() => setPasswordOpen(true)}>Change password</button>
              <button onClick={logout}>Sign out</button>
            </div>
            {["ADMIN", "STORE_OWNER"].includes(user.role) && (
              <button
                className="button small"
                onClick={() => setWorkspace(true)}
              >
                Workspace
              </button>
            )}
          </div>
        ) : (
          <div className="nav-actions">
            <button className="plain" onClick={() => openAuth()}>
              Sign in
            </button>
            <button
              className="button small"
              onClick={() => openAuth("register")}
            >
              Join RateHub <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
      </nav>

      <section className="hero shell">
        <div>
          <p className="eyebrow">
            <i /> HONEST OPINIONS. BETTER CHOICES.
          </p>
          <h1>
            Find places
            <br />
            worth <em>returning</em> to.
          </h1>
          <p className="lead">
            A thoughtfully curated way to discover local favourites, powered by
            the people who know them best.
          </p>
          <div className="search">
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places, neighbourhoods..."
            />
            <button
              onClick={() =>
                document
                  .querySelector("#discover")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="community">
            <div>
              <i>R</i>
              <i>M</i>
              <i>A</i>
              <i>S</i>
            </div>
            <p>
              <strong>12,000+ neighbours</strong>
              <br />
              sharing the good stuff
            </p>
          </div>
        </div>
        <div className="visual">
          <div className="orb pink" />
          <div className="orb green" />
          <div className="featured">
            <div className="featured-top">
              <b>✦</b>
              <span>● Open now</span>
            </div>
            <div>
              <p className="category">TODAY'S FAVOURITE</p>
              <h3>Aster &amp; Co.</h3>
              <p className="location">
                <Icon name="pin" size={15} /> Bandra West, Mumbai
              </p>
            </div>
            <div className="featured-foot">
              <div>
                <Stars value={4.9} />
                <strong>
                  4.9 <small>(218 reviews)</small>
                </strong>
              </div>
              <button
                onClick={() => {
                  setRatingStore(stores[0]);
                  setRating(0);
                }}
              >
                <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div className="bubble">
            <Icon name="heart" size={17} />
            <span>
              <strong>Made for locals</strong>
              <br />
              No paid placements. Ever.
            </span>
          </div>
        </div>
      </section>
      <div className="trust">
        <div className="shell">
          <span>
            <b>4.8</b> average community rating
          </span>
          <i />
          <span>
            <b>2,400+</b> brilliant local places
          </span>
          <i />
          <span>
            <b>100%</b> real neighbourhood voices
          </span>
        </div>
      </div>

      <section className="discover shell" id="discover">
        <header>
          <div>
            <p className="eyebrow">EXPLORE NEARBY</p>
            <h2>
              Good places, <em>found.</em>
            </h2>
          </div>
          <button
            className="view"
            onClick={() => {
              setQuery("");
              setFilter("All places");
            }}
          >
            View all places <Icon name="arrow" size={17} />
          </button>
        </header>
        <div className="filters">
          {[
            "All places",
            "Lifestyle",
            "Food & drink",
            "Books & gifts",
            "Home",
          ].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="cards">
          {visible.map((store) => (
            <article
              className="card"
              key={`${store.isDemo ? "demo" : "live"}-${store.id}`}
            >
              <div className={`art ${store.tint || "violet"}`}>
                <span>
                  {store.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <button>
                  <Icon name="heart" size={18} />
                </button>
              </div>
              <div className="card-body">
                <p className="category">
                  {store.category || "LOCAL FAVOURITE"}
                </p>
                <h3>{store.name}</h3>
                <p className="location">
                  <Icon name="pin" size={15} /> {store.address}
                </p>
                <div className="card-foot">
                  <div>
                    <Stars value={getStoreRating(store)} />
                    <strong>
                      {getStoreRating(store).toFixed(1)}{" "}
                      <small>({store.totalRatings})</small>
                    </strong>
                  </div>
                  <button
                    className="rate"
                    onClick={() => {
                      setRatingStore(store);
                      setRating(store.userRating || 0);
                    }}
                  >
                    {store.userRating ? "Edit rating" : "Rate place"}{" "}
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="empty">
            <Icon name="search" size={26} />
            <p>No places match that search yet.</p>
            <button
              className="plain"
              onClick={() => {
                setQuery("");
                setFilter("All places");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
      <footer className="shell">
        <button className="brand">
          <b>✦</b>rate<span>hub</span>
        </button>
        <p>Local is lovely. Let’s keep it that way.</p>
        <span>© 2026 RateHub</span>
      </footer>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        closeOnClick
        pauseOnHover
        theme="light"
      />
      {authOpen && (
        <div className="backdrop" onMouseDown={() => setAuthOpen(false)}>
          <section
            className="modal auth"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setAuthOpen(false)}>
              <Icon name="close" />
            </button>
            <b className="mark">✦</b>
            <p className="eyebrow">WELCOME TO RATEHUB</p>
            <h2>
              {authMode === "login"
                ? "Good to see you."
                : "Join the neighbourhood."}
            </h2>
            <p>
              {authMode === "login"
                ? "Sign in to rate your favourite local places."
                : "Start discovering places worth talking about."}
            </p>
            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <>
                  <label>
                    Full name
                    <input
                      required
                      minLength="20"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Your full name"
                    />
                  </label>
                  <label>
                    Address
                    <input
                      required
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="Your neighbourhood and city"
                    />
                  </label>
                </>
              )}
              <label>
                Email address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  minLength="8"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </label>
              <button className="button full" disabled={busy}>
                {busy
                  ? "One moment…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create my account"}{" "}
                <Icon name="arrow" size={16} />
              </button>
            </form>
            <div className="switch">
              {authMode === "login" ? "New around here?" : "Already a member?"}{" "}
              <button
                onClick={() =>
                  setAuthMode(authMode === "login" ? "register" : "login")
                }
              >
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </div>
          </section>
        </div>
      )}
      {passwordOpen && (
        <div className="backdrop" onMouseDown={() => setPasswordOpen(false)}>
          <section
            className="modal auth"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="close" onClick={() => setPasswordOpen(false)}>
              <Icon name="close" />
            </button>
            <p className="eyebrow">ACCOUNT SECURITY</p>
            <h2>Update password</h2>
            <p>Use a new 8–16 character password with an uppercase letter and special character.</p>
            <form onSubmit={changePassword}>
              <label>
                Current password
                <input
                  required
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                  }
                />
              </label>
              <label>
                New password
                <input
                  required
                  type="password"
                  minLength="8"
                  maxLength="16"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                  }
                />
              </label>
              <button className="button full" disabled={busy}>
                {busy ? "Updating…" : "Update password"} <Icon name="arrow" size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
      {ratingStore && (
        <div className="backdrop" onMouseDown={() => setRatingStore(null)}>
          <section
            className="modal rating"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setRatingStore(null)}>
              <Icon name="close" />
            </button>
            <p className="eyebrow">SHARE YOUR EXPERIENCE</p>
            <h2>
              How was <em>{ratingStore.name}</em>?
            </h2>
            <p>
              Your honest rating helps someone discover their next favourite
              place.
            </p>
            <Stars value={rating} editable onChange={setRating} />
            <strong>
              {rating
                ? [
                    "Not for me",
                    "Could be better",
                    "It was good",
                    "Really lovely",
                    "An absolute favourite",
                  ][rating - 1]
                : "Tap a star to rate"}
            </strong>
            <button
              className="button full"
              disabled={!rating || busy}
              onClick={saveRating}
            >
              {user ? "Save my rating" : "Sign in to rate"}{" "}
              <Icon name="arrow" size={16} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
export default App;
