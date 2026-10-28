import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import toast from 'react-hot-toast';
import './Customers.css';

const PAGE_SIZE = 1000;

const formatDate = (date) => {
  if (!date) return '—';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '—';
  return parsedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

const getDisplayName = (profile) =>
  `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
  profile.full_name?.trim() ||
  'InvoiceVault member';

const Customers = () => {
  const { user } = useAuth();
  const { profile: ownProfile } = useProfile();
  const [members, setMembers] = useState([]);
  const [myInvoiceCount, setMyInvoiceCount] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setMembers([]);
      setMyInvoiceCount(null);
      setLoading(false);
      return undefined;
    }

    let active = true;

    const fetchAllProfiles = async () => {
      const rows = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore && active) {
        const { data, error: queryError } = await supabase
          .from('public_profile_directory')
          .select('id, first_name, last_name, avatar_url, created_at')
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);

        if (queryError) throw queryError;

        const page = data || [];
        rows.push(...page);
        hasMore = page.length === PAGE_SIZE;
        offset += PAGE_SIZE;
      }

      return rows;
    };

    const fetchDirectory = async () => {
      setLoading(true);
      try {
        const [profileRows, invoiceResult] = await Promise.all([
          fetchAllProfiles(),
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        if (invoiceResult.error) throw invoiceResult.error;
        if (!active) return;

        const profilesById = new Map(
          profileRows.map((row) => [row.id, { ...row, isCurrentUser: row.id === user.id }]),
        );

        const ownName = getDisplayName({
          first_name: ownProfile?.firstName || ownProfile?.first_name,
          last_name: ownProfile?.lastName || ownProfile?.last_name,
          full_name:
            ownProfile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name,
        });

        if (!profilesById.has(user.id)) {
          profilesById.set(user.id, {
            id: user.id,
            first_name: ownProfile?.firstName || ownProfile?.first_name || '',
            last_name: ownProfile?.lastName || ownProfile?.last_name || '',
            full_name: ownName,
            avatar_url:
              ownProfile?.avatar ||
              ownProfile?.avatar_url ||
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
            created_at: user.created_at || null,
            isCurrentUser: true,
          });
        } else {
          const currentProfile = profilesById.get(user.id);
          profilesById.set(user.id, {
            ...currentProfile,
            full_name: ownName,
            avatar_url:
              currentProfile.avatar_url ||
              ownProfile?.avatar ||
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
            created_at: currentProfile.created_at || user.created_at || null,
          });
        }

        setMembers(
          Array.from(profilesById.values())
            .map((row) => ({
              id: row.id,
              name: row.id === user.id ? ownName : getDisplayName(row),
              avatarUrl:
                row.avatar_url ||
                (row.id === user.id
                  ? ownProfile?.avatar || user.user_metadata?.avatar_url || user.user_metadata?.picture
                  : null),
              joinedAt: row.created_at,
              isCurrentUser: row.id === user.id,
            }))
            .sort((a, b) => {
              if (a.isCurrentUser) return -1;
              if (b.isCurrentUser) return 1;
              return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            }),
        );
        setMyInvoiceCount(invoiceResult.count || 0);
        setError(false);
        setErrorMessage('');
      } catch (fetchError) {
        console.error('Error loading profile directory:', fetchError);
        if (active) {
          setError(true);
          const directoryTableMissing =
            fetchError?.code === '42P01' || fetchError?.code === 'PGRST205';
          setErrorMessage(
            directoryTableMissing
              ? 'The secure profile directory has not been set up in Supabase yet. Run the SQL in supabase_profile_directory.sql, then try again.'
              : 'We could not load the profile directory. Check your Supabase access policies and try again.',
          );
          toast.error(
            directoryTableMissing
              ? 'Profile directory setup is required in Supabase'
              : 'Failed to load the profile directory',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDirectory();

    return () => {
      active = false;
    };
  }, [user, ownProfile, refreshKey]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return members;
    return members.filter((member) => member.name.toLowerCase().includes(normalizedSearch));
  }, [members, search]);

  return (
    <div className="customers-page">
      <header className="customers-page-header">
        <div>
          <span className="customers-eyebrow">INVOICEVAULT COMMUNITY</span>
          <h1>Customers</h1>
          <p>Meet the InvoiceVault community keeping their purchases organized.</p>
        </div>
        <Link className="customers-create-link" to="/dashboard/invoices">
          Go to invoices <FiArrowUpRight aria-hidden="true" />
        </Link>
      </header>

      <section className="customers-stats" aria-label="Profile directory summary">
        <article className="customers-stat-card">
          <span className="customers-stat-icon"><FiUsers aria-hidden="true" /></span>
          <div>
            <span className="customers-stat-value">{loading ? '—' : members.length}</span>
            <span className="customers-stat-label">Total customers</span>
          </div>
        </article>
        <article className="customers-stat-card">
          <span className="customers-stat-icon invoices"><FiArrowUpRight aria-hidden="true" /></span>
          <div>
            <span className="customers-stat-value">{myInvoiceCount === null ? '—' : myInvoiceCount}</span>
            <span className="customers-stat-label">Your invoices</span>
          </div>
        </article>
        <article className="customers-stat-card">
          <span className="customers-stat-icon repeat"><FiUsers aria-hidden="true" /></span>
          <div>
            <span className="customers-stat-value customers-private-value">Private</span>
            <span className="customers-stat-label">Other invoice data</span>
          </div>
        </article>
      </section>

      <section className="customers-list-section">
        <div className="customers-list-heading">
          <div>
            <h2>All customers</h2>
            <p>
              {loading
                ? 'Loading customers…'
                : `${filteredMembers.length} ${filteredMembers.length === 1 ? 'customer' : 'customers'} in our InvoiceVault community`}
            </p>
          </div>
          <label className="customers-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers"
              aria-label="Search customers"
            />
          </label>
        </div>

        <p className="customers-privacy-note">
          Profile fields are limited to name, photo, and join date. Invoice records are never shown;
          the invoice count above is only for your own account.
        </p>

        {error ? (
          <div className="customers-empty-state">
            <span className="customers-empty-icon"><FiRefreshCw aria-hidden="true" /></span>
            <h3>
              {errorMessage.includes('has not been set up')
                ? 'Complete the Supabase setup'
                : 'We couldn’t load profiles'}
            </h3>
            <p>{errorMessage || 'No private invoice data was requested.'}</p>
            <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="customers-loading" aria-label="Loading profiles">
            <span />
            <span />
            <span />
          </div>
        ) : filteredMembers.length ? (
          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Account</th>
                  <th scope="col">Invoices</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id}>
                    <td data-label="Member">
                      <div className="customer-name-cell">
                        {member.avatarUrl ? (
                          <img
                            className="customer-avatar customer-avatar-photo"
                            src={member.avatarUrl}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span className={`customer-avatar customer-avatar-${index % 6}`}>
                            {getInitials(member.name)}
                          </span>
                        )}
                        <span className="customer-name">{member.name}</span>
                        {member.isCurrentUser && <span className="customer-you-badge">You</span>}
                      </div>
                    </td>
                    <td data-label="Joined">
                      <span className="customer-joined-date">{formatDate(member.joinedAt)}</span>
                    </td>
                    <td data-label="Account">
                      <span className={`customer-status ${member.isCurrentUser ? 'active' : 'member'}`}>
                        <span className="customer-status-dot" />
                        {member.isCurrentUser ? 'Your account' : 'Member'}
                      </span>
                    </td>
                    <td data-label="Invoices">
                      <span className="customer-invoice-count">
                        {member.isCurrentUser && myInvoiceCount !== null ? myInvoiceCount : 'Private'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customers-empty-state">
            <span className="customers-empty-icon"><FiUsers aria-hidden="true" /></span>
            <h3>{search ? 'No matching profiles' : 'No profiles are visible'}</h3>
            <p>
              {search
                ? 'Try another name or clear your search.'
                : 'Your own profile is included when you are signed in. Other profiles are shown only when Supabase access rules allow it.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Customers;
