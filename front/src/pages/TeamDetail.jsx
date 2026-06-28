import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { teamsApi } from '../api/teams.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTeam } from '../context/TeamContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';
import { MemberList } from '../components/teams/MemberList.jsx';
import { InviteCodeBox } from '../components/teams/InviteCodeBox.jsx';
import { TempPasswordModal } from '../components/teams/TempPasswordModal.jsx';
import { MemberEditModal } from '../components/teams/MemberEditModal.jsx';

export default function TeamDetail() {
  const { id } = useParams();
  const teamId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadTeams } = useTeam();
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const [team, setTeam] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  const load = useCallback(() => {
    teamsApi.detail(teamId).then(setTeam).catch(toast.fromError);
  }, [teamId]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  if (!team) return <p className="muted">{t('common.loading')}</p>;

  const me = team.members.find((m) => m.user_id === user.id);
  const isAdmin = me?.is_admin;
  const isManager = me?.role === 'manager' && me?.status === 'active';

  async function onApprove(member, role) {
    try {
      await teamsApi.approve(teamId, member.user_id, role);
      toast.success(t('teamDetail.approvedToast', { name: member.first_name, role: t(`roles.${role}`) }));
      await reloadTeams();
      load();
      // Pour les équipiers, on enchaîne directement avec le setup
      // wizard (poste + heures contractuelles). C'est ce qui rend
      // l'expérience administrateur cohérente : valider = configurer.
      if (role === 'equipier') {
        setEditingMember({ ...member, role });
      }
    } catch (err) { toast.fromError(err); }
  }

  async function onRemove(member) {
    const ok = await confirm({
      title: t('teamDetail.removeMemberTitle'),
      message: t('teamDetail.removeMemberMessage', { first: member.first_name, last: member.last_name }),
      confirmLabel: t('teamDetail.removeMemberLabel'), danger: true,
    });
    if (!ok) return;
    try {
      await teamsApi.removeMember(teamId, member.user_id);
      toast.success(t('teamDetail.memberRemovedToast'));
      await reloadTeams(); load();
    } catch (err) { toast.fromError(err); }
  }

  function onUpdate(member) {
    // Ouvre le modal d'édition riche (au lieu de juste toggle manager/equipier)
    setEditingMember(member);
  }

  async function saveMember(fields) {
    try {
      await teamsApi.updateMember(teamId, editingMember.user_id, fields);
      toast.success(t('teamDetail.roleUpdatedToast'));
      setEditingMember(null);
      load();
      await reloadTeams();
    } catch (err) { toast.fromError(err); }
  }

  async function regenerate() {
    const ok = await confirm({
      title: t('teamDetail.regenerateTitle'),
      message: t('teamDetail.regenerateMessage'),
      confirmLabel: t('teamDetail.regenerateLabel'),
    });
    if (!ok) return;
    try {
      const { invite_code } = await teamsApi.regenerateCode(teamId);
      setTeam({ ...team, invite_code });
      toast.success(t('teamDetail.codeRegeneratedToast'));
    } catch (err) { toast.fromError(err); }
  }

  async function saveName() {
    try {
      const updated = await teamsApi.rename(teamId, newName);
      setTeam({ ...team, name: updated.name });
      setEditingName(false);
      toast.success(t('teamDetail.nameUpdatedToast'));
      await reloadTeams();
    } catch (err) { toast.fromError(err); }
  }

  async function onResetPassword(member) {
    const ok = await confirm({
      title: t('teamDetail.resetPasswordTitle'),
      message: t('teamDetail.resetPasswordMessage', { first: member.first_name, last: member.last_name }),
      confirmLabel: t('teamDetail.resetPasswordLabel'),
    });
    if (!ok) return;
    try {
      const res = await teamsApi.resetMemberPassword(teamId, member.user_id);
      setResetResult({ member, password: res.temp_password });
    } catch (err) { toast.fromError(err); }
  }

  async function leave() {
    const ok = await confirm({
      title: t('teamDetail.leaveTitle'),
      message: t('teamDetail.leaveMessage', { name: team.name }),
      confirmLabel: t('teamDetail.leaveLabel'), danger: true,
    });
    if (!ok) return;
    try {
      await teamsApi.leave(teamId);
      toast.success(t('teamDetail.leftToast'));
      await reloadTeams();
      navigate('/teams');
    } catch (err) { toast.fromError(err); }
  }

  return (
    <>
      <div className="page-header">
        {editingName ? (
          <div className="row" style={{ flex: 1 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
                   style={{ maxWidth: 320, fontSize: '1.5rem', fontWeight: 700 }} />
            <button onClick={saveName}>{t('common.save')}</button>
            <button className="secondary" onClick={() => setEditingName(false)}>{t('common.cancel')}</button>
          </div>
        ) : (
          <h1>{team.name}</h1>
        )}
        <div className="row">
          {/* Configuration ouverte à tous les managers (manager role),
              pas seulement aux admins — sinon Sophie/Ahmed ne peuvent
              pas accéder aux réglages (jours d'ouverture, idéaux poste,
              taux horaires) alors qu'ils sont managers. */}
          {isManager && !editingName && (
            <button className="secondary" onClick={() => navigate(`/teams/${teamId}/settings`)}>
              <Settings size={14} /> {t('teamDetail.settingsButton', 'Configuration')}
            </button>
          )}
          {isAdmin && !editingName && (
            <button className="secondary" onClick={() => { setNewName(team.name); setEditingName(true); }}>
              <Edit2 size={14} /> {t('teamDetail.renameButton')}
            </button>
          )}
          <button className="ghost" onClick={leave}>
            <LogOut size={14} /> {t('teamDetail.leaveButton')}
          </button>
        </div>
      </div>

      {isAdmin && (
        <InviteCodeBox code={team.invite_code} onRegenerate={regenerate} canRegenerate />
      )}

      <MemberList
        members={team.members}
        currentUserId={user.id}
        isAdmin={isAdmin}
        onApprove={onApprove}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onResetPassword={onResetPassword}
      />

      {resetResult && (
        <TempPasswordModal
          member={resetResult.member}
          password={resetResult.password}
          onClose={() => setResetResult(null)}
        />
      )}

      {editingMember && (
        <MemberEditModal
          member={editingMember}
          canChangeRole={isAdmin && editingMember.user_id !== user.id}
          onClose={() => setEditingMember(null)}
          onSave={saveMember}
        />
      )}
    </>
  );
}
