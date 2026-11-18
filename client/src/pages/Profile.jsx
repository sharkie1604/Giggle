import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Github,
  Globe,
  Star,
  Briefcase,
  ExternalLink,
  Edit3,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();

  // If URL has :id use that; otherwise fall back to authenticated user's ID
  const targetUserId = id ? Number(id) : currentUser?.id;
  const isOwner = Boolean(currentUser && currentUser.id === targetUserId);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Self-edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    githubUrl: '',
    portfolioUrl: '',
    upiId: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const isClientProfile = profileUser?.role === 'CLIENT';

  // Fetch profile on targetUserId change
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!targetUserId) {
        setError('No user specified.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/users/${targetUserId}`);
        if (isMounted) {
          const u = res.data.user;
          setProfileUser(u);

          // Pre-populate edit form
          // Note: upiId is initialized from currentUser.upiId if owner, because GET /api/users/:id omits upiId for PII isolation!
          setEditFormData({
            name: u.name || '',
            bio: u.bio || '',
            skills: Array.isArray(u.skills) ? u.skills.join(', ') : '',
            githubUrl: u.githubUrl || '',
            portfolioUrl: u.portfolioUrl || '',
            upiId: isOwner ? currentUser?.upiId || '' : '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.status === 404
              ? 'User not found.'
              : 'Failed to load user profile.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, isOwner, currentUser?.upiId]);

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      const payload = {
        name: editFormData.name.trim(),
        bio: editFormData.bio ? editFormData.bio.trim() : null,
        portfolioUrl: editFormData.portfolioUrl
          ? editFormData.portfolioUrl.trim()
          : null,
      };

      if (!isClientProfile) {
        const parsedSkills = editFormData.skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        payload.skills = parsedSkills;
        payload.githubUrl = editFormData.githubUrl
          ? editFormData.githubUrl.trim()
          : null;
        payload.upiId = editFormData.upiId
          ? editFormData.upiId.trim()
          : null;
      }

      const res = await api.patch(`/users/${targetUserId}`, payload);
      const updated = res.data.user;

      // Update AuthContext state & storage
      updateUser(updated);

      // Update local view state
      setProfileUser((prev) => ({
        ...prev,
        ...updated,
        // Preserve computed / relation fields from public view
        averageRating: prev.averageRating,
        totalReviews: prev.totalReviews,
        reviewsReceived: prev.reviewsReceived,
        completedGigs: prev.completedGigs,
        jobsPosted: prev.jobsPosted,
      }));

      setSaveSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      const data = err.response?.data;
      let apiMsg = 'Failed to update profile. Please verify your fields.';
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        apiMsg = data.errors.map((e) => e.message || e).join('. ');
      } else if (data?.message) {
        apiMsg = data.message;
      }
      setSaveError(apiMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'CLIENT':
        return 'bg-finn text-ink';
      case 'FREELANCER':
        return 'bg-jake text-ink';
      case 'ADMIN':
        return 'bg-bubblegum text-ink';
      default:
        return 'bg-paper text-ink';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block p-6 brutal-card bg-paper">
          <div className="w-10 h-10 border-4 border-ink border-t-finn rounded-full animate-spin mx-auto mb-3"></div>
          <p className="font-heading font-black text-lg text-ink">
            LOADING PROFILE...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="brutal-card p-8 bg-white border-4 border-ink shadow-brutal">
          <div className="w-12 h-12 bg-bubblegum border-3 border-ink rounded-xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-ink" />
          </div>
          <h2 className="text-2xl font-black font-heading text-ink mb-2">
            USER NOT FOUND
          </h2>
          <p className="text-sm font-semibold text-gray-700 mb-6">
            {error || 'This user profile does not exist or has been removed.'}
          </p>
          <Link to="/jobs" className="brutal-btn bg-jake text-xs py-2 px-4">
            BROWSE TECH GIGS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="p-3 bg-jake border-3 border-ink rounded-lg shadow-brutal-sm flex items-center justify-between text-ink animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button
            onClick={() => setSaveSuccess('')}
            className="text-xs font-black underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Public Profile Card */}
      <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal relative">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-4 border-ink">
          <div className="flex items-center gap-4">
            {/* Avatar Pill */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-finn border-4 border-ink shadow-brutal-sm flex items-center justify-center font-heading font-black text-3xl text-ink">
              {profileUser.name ? profileUser.name[0].toUpperCase() : 'U'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-ink">
                  {profileUser.name}
                </h1>
                <span
                  className={`brutal-badge text-xs ${getRoleBadgeColor(
                    profileUser.role
                  )}`}
                >
                  {profileUser.role}
                </span>
              </div>

              {/* Rating & Joined info */}
              <div className="flex items-center gap-4 mt-1 text-xs font-bold text-gray-700 flex-wrap">
                {!isClientProfile && (
                  <div className="flex items-center gap-1 text-ink">
                    <Star className="w-4 h-4 fill-jake text-ink" />
                    {profileUser.averageRating !== null ? (
                      <span>
                        {profileUser.averageRating} / 5.0 ({profileUser.totalReviews}{' '}
                        {profileUser.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium">
                        No reviews yet
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1 text-gray-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Member since{' '}
                    {new Date(profileUser.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Edit Action Button */}
          {isOwner && (
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setSaveError('');
              }}
              className="brutal-btn bg-jake text-xs py-2 px-3 shadow-brutal-sm flex items-center gap-1 self-stretch sm:self-auto justify-center"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'CLOSE EDITOR' : 'EDIT PROFILE'}
            </button>
          )}
        </div>

        {/* Bio & Details Section */}
        <div className="pt-6 space-y-6">
          {isClientProfile ? (
            <>
              {/* About Client */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                  ABOUT CLIENT
                </h3>
                <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-line bg-paper p-4 rounded-lg border-2 border-ink">
                  {profileUser.bio || 'No company or client bio provided yet.'}
                </p>
              </div>

              {/* Website / Company Link */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                  WEBSITE / COMPANY LINK
                </h3>
                <div>
                  {profileUser.portfolioUrl ? (
                    <a
                      href={profileUser.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-white hover:bg-gray-100 shadow-brutal-sm text-xs font-bold text-ink transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    >
                      <Globe className="w-4 h-4 text-finn" />
                      Company Website
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">
                      No website linked
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* About Freelancer */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                  ABOUT FREELANCER
                </h3>
                <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-line bg-paper p-4 rounded-lg border-2 border-ink">
                  {profileUser.bio || 'No bio description provided yet.'}
                </p>
              </div>

              {/* Technical Skills */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                  SKILLS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills && profileUser.skills.length > 0 ? (
                    profileUser.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="brutal-badge bg-paper text-ink text-xs font-mono"
                      >
                        #{skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 font-medium">
                      No technical skills listed yet.
                    </p>
                  )}
                </div>
              </div>

              {/* GitHub & Portfolio Links */}
              <div>
                <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">
                  GITHUB & PORTFOLIO LINKS
                </h3>
                <div className="flex flex-wrap gap-3">
                  {profileUser.githubUrl ? (
                    <a
                      href={profileUser.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-white hover:bg-gray-100 shadow-brutal-sm text-xs font-bold text-ink transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    >
                      <Github className="w-4 h-4" />
                      GitHub Profile
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">
                      No GitHub linked
                    </span>
                  )}

                  {profileUser.portfolioUrl && (
                    <a
                      href={profileUser.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-ink bg-white hover:bg-gray-100 shadow-brutal-sm text-xs font-bold text-ink transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    >
                      <Globe className="w-4 h-4 text-finn" />
                      Portfolio Website
                      <ExternalLink className="w-3 h-3 text-gray-500 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Self-Edit Form Card (Visible only when isOwner && isEditing) */}
      {isOwner && isEditing && (
        <div className="brutal-card p-6 sm:p-8 bg-paper border-4 border-ink shadow-brutal animate-fade-in">
          <div className="flex items-center justify-between pb-4 mb-6 border-b-3 border-ink">
            <h2 className="text-xl font-black font-heading text-ink flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-finn" />
              {isClientProfile ? 'EDIT CLIENT PROFILE' : 'EDIT YOUR PROFILE & PAYOUT ADDRESS'}
            </h2>
            <span className="text-xs font-bold text-gray-500 uppercase">
              OWNER RESTRICTED
            </span>
          </div>

          {saveError && (
            <div className="mb-6 p-3 bg-bubblegum border-3 border-ink rounded-lg shadow-brutal-sm flex items-start gap-2 text-ink">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-bold">{saveError}</div>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {isClientProfile ? (
              <>
                {/* Client Edit Fields: Name, Bio/Company, Website */}
                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="brutal-input"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink">
                    About You / Company
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={editFormData.bio}
                    onChange={handleEditChange}
                    maxLength={2000}
                    className="brutal-input resize-y"
                    placeholder="Describe your company, projects, or hiring needs..."
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink">
                    Website URL (Must be HTTPS)
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={editFormData.portfolioUrl}
                    onChange={handleEditChange}
                    className="brutal-input font-mono text-xs"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Freelancer Edit Fields: Name, UPI, Bio, Skills, GitHub, Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block font-bold mb-1 uppercase text-xs text-ink">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                      minLength={2}
                      maxLength={100}
                      className="brutal-input"
                    />
                  </div>

                  {/* Private UPI ID */}
                  <div>
                    <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-bmo" />
                        Private UPI ID (Payouts)
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">
                        Hidden from public
                      </span>
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={editFormData.upiId}
                      onChange={handleEditChange}
                      className="brutal-input font-mono"
                      placeholder="e.g. dev@okhdfcbank"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink">
                    Bio / Technical Summary
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={editFormData.bio}
                    onChange={handleEditChange}
                    maxLength={2000}
                    className="brutal-input resize-y"
                    placeholder="Share your technical experience, preferred stacks, and previous accomplishments..."
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block font-bold mb-1 uppercase text-xs text-ink flex items-center justify-between">
                    <span>Technical Skills</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Comma-separated
                    </span>
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={editFormData.skills}
                    onChange={handleEditChange}
                    className="brutal-input"
                    placeholder="React, Node.js, Express, PostgreSQL, Tailwind"
                  />
                </div>

                {/* External Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 uppercase text-xs text-ink">
                      GitHub Profile URL (Must be HTTPS)
                    </label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={editFormData.githubUrl}
                      onChange={handleEditChange}
                      className="brutal-input font-mono text-xs"
                      placeholder="https://github.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 uppercase text-xs text-ink">
                      Portfolio Website (Must be HTTPS)
                    </label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      value={editFormData.portfolioUrl}
                      onChange={handleEditChange}
                      className="brutal-input font-mono text-xs"
                      placeholder="https://yourportfolio.dev"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saveLoading}
                className="brutal-btn bg-finn text-xs py-2.5 px-6 shadow-brutal-sm"
              >
                {saveLoading ? 'SAVING CHANGES...' : 'SAVE PROFILE CHANGES'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border-2 border-ink rounded font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Work History Section */}
      {isClientProfile ? (
        <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b-3 border-ink">
            <Briefcase className="w-5 h-5 text-finn" />
            <h2 className="text-xl font-black font-heading text-ink">
              GIGS POSTED ({profileUser.jobsPosted ? profileUser.jobsPosted.length : 0})
            </h2>
          </div>

          {profileUser.jobsPosted && profileUser.jobsPosted.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileUser.jobsPosted.map((gig) => (
                <Link
                  key={gig.id}
                  to={`/jobs/${gig.id}`}
                  className="p-4 border-3 border-ink rounded-xl bg-paper shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all block group"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="brutal-badge bg-finn text-[10px]">
                        {gig.category}
                      </span>
                      <span
                        className={`brutal-badge text-[10px] ${
                          gig.status === 'OPEN'
                            ? 'bg-jake text-ink'
                            : gig.status === 'COMPLETED'
                            ? 'bg-bmo text-ink'
                            : 'bg-paper text-ink'
                        }`}
                      >
                        {gig.status}
                      </span>
                    </div>
                    <span className="font-mono font-black text-xs text-ink">
                      ₹{Number(gig.budget).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-sm text-ink group-hover:text-finn transition-colors line-clamp-1">
                    {gig.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-gray-500 mt-2 flex items-center justify-between">
                    <span>
                      Posted{' '}
                      {new Date(gig.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-finn font-bold group-hover:underline">
                      View Gig &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
              <p className="text-sm font-bold text-gray-600">
                No gigs posted yet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Freelancer: Completed Tech Gigs */}
          <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b-3 border-ink">
              <Briefcase className="w-5 h-5 text-finn" />
              <h2 className="text-xl font-black font-heading text-ink">
                COMPLETED GIGS ({profileUser.completedGigs ? profileUser.completedGigs.length : 0})
              </h2>
            </div>

            {profileUser.completedGigs && profileUser.completedGigs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileUser.completedGigs.map((gig) => (
                  <Link
                    key={gig.id}
                    to={`/jobs/${gig.id}`}
                    className="p-4 border-3 border-ink rounded-xl bg-paper shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all block group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="brutal-badge bg-finn text-[10px]">
                        {gig.category}
                      </span>
                      <span className="font-mono font-black text-xs text-ink">
                        ₹{Number(gig.budget).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-sm text-ink group-hover:text-finn transition-colors line-clamp-1">
                      {gig.title}
                    </h3>
                    <div className="text-[11px] font-semibold text-gray-500 mt-2 flex items-center justify-between">
                      <span>
                        Completed{' '}
                        {new Date(gig.updatedAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-finn font-bold group-hover:underline">
                        View Gig &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
                <p className="text-sm font-bold text-gray-600">
                  No completed gigs recorded yet.
                </p>
              </div>
            )}
          </div>

          {/* Freelancer: Reviews Received Section */}
          <div className="brutal-card p-6 sm:p-8 bg-white border-4 border-ink shadow-brutal">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b-3 border-ink">
              <MessageSquare className="w-5 h-5 text-jake" />
              <h2 className="text-xl font-black font-heading text-ink">
                REVIEWS ({profileUser.reviewsReceived ? profileUser.reviewsReceived.length : 0})
              </h2>
            </div>

            {profileUser.reviewsReceived && profileUser.reviewsReceived.length > 0 ? (
              <div className="space-y-4">
                {profileUser.reviewsReceived.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 border-2 border-ink rounded-lg bg-paper shadow-brutal-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">
                          {rev.reviewer?.name || 'Verified Client'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          •{' '}
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5 text-jake">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-jake text-ink'
                                : 'text-gray-300 fill-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-ink font-medium leading-relaxed">
                      "{rev.comment || 'Smooth milestone execution and clean code delivery.'}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-paper border-2 border-dashed border-ink rounded-xl">
                <p className="text-sm font-bold text-gray-600">
                  No reviews received yet. Reviews appear once milestone payouts are released.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
