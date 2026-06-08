import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, LogOut, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { familiesApi } from '../api/families.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFamily } from '../context/FamilyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus.js';
import { MemberList } from '../components/families/MemberList.jsx';
import { InviteCodeBox } from '../components/families/InviteCodeBox.jsx';
import { TempPasswordModal } from '../components/families/TempPasswordModal.jsx';
import { MemberEditModal } from '../components/families/MemberEditModal.jsx';

export default function FamilyDetail() {
  const { id } = useParams();
  const familyId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadFamilies } = useFamily();
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useTranslation();
  const [family, setFamily] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  const load = useCallback(() => {
    familiesApi.detail(familyId).then(setFamily).catch(toast.fromError);
  }, [familyId]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnFocus(load);

  if (!family) return <p className="muted">{t('common.loading')}</p>;

  const me = family.members.find((m) => m.user_id === user.id);
  const isAdmin = me?.is_admin;
  const isManager = me?.role === 'parent' && me?.status === 'active';

  async function onApprove(member, role) {
    try {
      await familiesApi.approve(familyId, member.user_id, role);
      toast.success(t('familyDetail.approvedToast', { name: member.first_name, role: t(`roles.${role}`) }));
      await reloadFamilies();
      load();
      // Pour les équipiers, on enchaîne directement avec le setup
      // wizard (poste + heures contractuelles). C'est ce qui rend
      // l'expérience administrateur cohérente : valider = configurer.
      if (role === 'child') {
        setEditingMember({ ...member, role });
      }
    } catch (err) { toast.fromError(err); }
  }

  async function onRemove(member) {
    const ok = await confirm({
      title: t('familyDetail.removeMemberTitle'),
      message: t('familyDetail.removeMemberMessage', { first: member.first_name, last: member.last_name }),
      confirmLabel: t('familyDetail.removeMemberLabel'), danger: true,
    });
    if (!ok) return;
    try {
      await familiesApi.removeMember(familyId, member.user_id);
      toast.success(t('familyDetail.memberRemovedToast'));
      await reloadFamilies(); load();
    } catch (err) { toast.fromError(err); }
  }

  function onUpdate(member) {
    // Ouvre le modal d'édition riche (au lieu de juste toggle parent/child)
    setEditingMember(member);
  }

  async function saveMember(fields) {
    try {
      await familiesApi.updateMember(familyId, editingMember.user_id, fields);
      toast.success(t('familyDetail.roleUpdatedToast'));
      setEditingMember(null);
      load();
      await reloadFamilies();
    } catch (err) { toast.fromError(err); }
  }

  async function regenerate() {
    const ok = await confirm({
      title: t('familyDetail.regenerateTitle'),
      message: t('familyDetail.regenerateMessage'),
      confirmLabel: t('familyDetail.regenerateLabel'),
    });
    if (!ok) return;
    try {
      const { invite_code } = await familiesApi.regenerateCode(familyId);
      setFamily({ ...family, invite_code });
      toast.success(t('familyDetail.codeRegeneratedToast'));
    } catch (err) { toast.fromError(err); }
  }

  async function saveName() {
    try {
      const updated = await familiesApi.rename(familyId, newName);
      setFamily({ ...family, name: updated.name });
      setEditingName(false);
      toast.success(t('familyDetail.nameUpdatedToast'));
      await reloadFamilies();
    } catch (err) { toast.fromError(err); }
  }

  async function onResetPassword(member) {
    const ok = await confirm({
      title: t('familyDetail.resetPasswordTitle'),
      message: t('familyDetail.resetPasswordMessage', { first: member.first_name, last: member.last_name }),
      confirmLabel: t('familyDetail.resetPasswordLabel'),
    });
    if (!ok) return;
    try {
      const res = await familiesApi.resetMemberPassword(familyId, member.user_id);
      setResetResult({ member, password: res.temp_password });
    } catch (err) { toast.fromError(err); }
  }

  async function leave() {
    const ok = await confirm({
      title: t('familyDetail.leaveTitle'),
      message: t('familyDetail.leaveMessage', { name: family.name }),
      confirmLabel: t('familyDetail.leaveLabel'), danger: true,
    });
    if (!ok) return;
    try {
      await familiesApi.leave(familyId);
      toast.success(t('familyDetail.leftToast'));
      await reloadFamilies();
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
          <h1>{family.name}</h1>
        )}
        <div className="row">
          {/* Configuration ouverte à tous les managers (parent role),
              pas seulement aux admins — sinon Sophie/Ahmed ne peuvent
              pas accéder aux réglages (jours d'ouverture, idéaux poste,
              taux horaires) alors qu'ils sont managers. */}
          {isManager && !editingName && (
            <button className="secondary" onClick={() => navigate(`/teams/${familyId}/settings`)}>
              <Settings size={14} /> {t('familyDetail.settingsButton', 'Configuration')}
            </button>
          )}
          {isAdmin && !editingName && (
            <button className="secondary" onClick={() => { setNewName(family.name); setEditingName(true); }}>
              <Edit2 size={14} /> {t('familyDetail.renameButton')}
            </button>
          )}
          <button className="ghost" onClick={leave}>
            <LogOut size={14} /> {t('familyDetail.leaveButton')}
          </button>
        </div>
      </div>

      {isAdmin && (
        <InviteCodeBox code={family.invite_code} onRegenerate={regenerate} canRegenerate />
      )}

      <MemberList
        members={family.members}
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
