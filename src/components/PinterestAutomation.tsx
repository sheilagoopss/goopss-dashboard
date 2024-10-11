import React, { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext'; // Import the useAuth hook

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  headerContent: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#111827',
  },
  main: {
    maxWidth: '80rem',
    margin: '0 auto',
    padding: '1.5rem 1rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    marginBottom: '2rem',
  },
  cardHeader: {
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  cardContent: {
    padding: '1.5rem',
  },
  storeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  storeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  storeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  storeName: {
    fontWeight: 500,
  },
  storeAccount: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '0.5rem',
    marginBottom: '1rem', // Add margin bottom for spacing between form groups
  },
  label: {
    fontWeight: 500,
    marginBottom: '0.25rem', // Add margin bottom for spacing between label and input
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.25rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '1rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  gridTwo: {
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
};

function PinterestConnectButton({ onConnect }: { onConnect: () => void }) {
  return <button style={styles.button} onClick={onConnect}>Connect to Pinterest</button>;
}

function PinterestAutomation() {
  const { user } = useAuth(); // Get the current user from AuthContext
  const [isPinterestConnected, setIsPinterestConnected] = useState(false);
  const [stores, setStores] = useState<Array<{ id: number, name: string, pinterestAccount: string }>>([]);

  const [rules, setRules] = useState<Array<{
    id: number,
    name: string,
    store: string,
    board: string,
    frequency: number,
    timezone: string,
    images: string,
    active: boolean,
  }>>([]);

  const [boards, setBoards] = useState([
    { id: 1, name: "Handmade Crafts" },
    { id: 2, name: "Retro Collectibles" },
    { id: 3, name: "DIY Projects" },
  ]);

  const [productSections, setProductSections] = useState([
    { id: 1, name: "New Arrivals" },
    { id: 2, name: "Best Sellers" },
    { id: 3, name: "Sale Items" },
    { id: 4, name: "Featured Products" },
  ]);

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Asia/Tokyo",
  ];

  useEffect(() => {
    // If there's a logged-in user, set their store as the only option
    if (user) {
      setStores([
        { id: 1, name: user.store_name, pinterestAccount: "" }
      ]);
    }
  }, [user]);

  const addStore = () => {
    const newStore = {
      id: stores.length + 1,
      name: "New Store",
      pinterestAccount: "",
    };
    setStores([...stores, newStore]);
  };

  const addRule = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newRule = {
      id: rules.length + 1,
      name: formData.get("ruleName") as string,
      store: formData.get("store") as string,
      board: formData.get("board") as string,
      frequency: parseInt(formData.get("frequency") as string),
      timezone: formData.get("timezone") as string,
      images: formData.get("images") as string,
      productSection: formData.get("productSection") as string,
      active: true,
    };
    setRules([...rules, newRule]);
    (event.target as HTMLFormElement).reset();
  };

  const handleConnectPinterest = () => {
    setIsPinterestConnected(true);
    // TODO: Implement Pinterest connection
    // const authUrl = `https://www.pinterest.com/oauth/?client_id=${PINTEREST_APP_ID}&redirect_uri=${encodeURIComponent(
    //   REDIRECT_URI
    // )}&response_type=code&scope=boards:read,pins:read`;
    // window.location.href = authUrl;
    alert("Successfully connected to Pinterest!");
  };

  if (!isPinterestConnected) {
    return (
      <div style={styles.container}>
        <PinterestConnectButton onConnect={handleConnectPinterest} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h2 style={styles.title}>Pinterest Automation</h2>
        </div>
      </div>

      <div style={styles.main}>
        {/* Stores and Pinterest Accounts Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Connected Stores</h2>
          </div>
          <div style={styles.cardContent}>
            <div>
              {stores.map((store) => (
                <div key={store.id} style={styles.storeItem}>
                  <div style={styles.storeInfo}>
                    <span>🏪</span>
                    <div>
                      <p style={styles.storeName}>{store.name}</p>
                      <p style={styles.storeAccount}>
                        Pinterest: {store.pinterestAccount || "Not connected"}
                      </p>
                    </div>
                  </div>
                  <button style={{...styles.button, ...styles.buttonOutline}}>
                    Manage
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addStore} style={{...styles.button, marginTop: '1rem'}}>
              ➕ Add Etsy Store
            </button>
          </div>
        </div>

        {/* Automation Rules Section */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Automation Rules</h2>
          </div>
          <div style={styles.cardContent}>
            {rules.length > 0 ? (
              <div>
                {rules.map((rule) => (
                  <div key={rule.id} style={styles.storeItem}>
                    <div>
                      <p style={styles.storeName}>{rule.name}</p>
                      <p style={styles.storeAccount}>
                        {rule.store} → {rule.board} | Every {rule.frequency} hours
                        | {rule.timezone} | Images:{" "}
                        {rule.images === "main" ? "Main only" : "All"}
                      </p>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <input type="checkbox" checked={rule.active} readOnly />
                      <button style={{...styles.button, ...styles.buttonOutline}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No automation rules have been set up yet.</p>
            )}
          </div>
        </div>

        {/* New Rule Form */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Add New Rule</h2>
          </div>
          <div style={styles.cardContent}>
            <form onSubmit={addRule}>
              <div style={styles.gridTwo}>
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label htmlFor="ruleName" style={styles.label}>Rule Name</label>
                  <input
                    id="ruleName"
                    name="ruleName"
                    placeholder="Enter rule name"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="store" style={styles.label}>Etsy Store</label>
                  <select name="store" required style={styles.select}>
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.name}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="board" style={styles.label}>Pin to Board</label>
                  <select name="board" required style={styles.select}>
                    <option value="">Select board</option>
                    {boards.map((board) => (
                      <option key={board.id} value={board.name}>
                        {board.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.formGroup}>
                  <label htmlFor="frequency" style={styles.label}>Frequency (hours)</label>
                  <input
                    id="frequency"
                    name="frequency"
                    type="number"
                    min="1"
                    placeholder="6"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="timezone" style={styles.label}>Timezone</label>
                  <select name="timezone" required style={styles.select}>
                    <option value="">Select timezone</option>
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="productSection" style={styles.label}>Product Section</label>
                  <select name="productSection" required style={styles.select}>
                    <option value="any">Any Section</option>
                    {productSections.map((section) => (
                      <option key={section.id} value={section.name}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <p style={styles.label}>Images to Pin</p>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input type="radio" name="images" value="main" defaultChecked required />
                    <span>Just the main image</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input type="radio" name="images" value="all" required />
                    <span>All listing images</span>
                  </label>
                </div>
              </div>

              <button type="submit" style={{...styles.button, marginTop: '1rem'}}>
                ➕ Add Automation Rule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PinterestAutomation;