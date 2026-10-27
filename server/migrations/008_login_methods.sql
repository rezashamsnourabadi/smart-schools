ALTER TABLE sessions RENAME COLUMN mfa TO privileged;
ALTER TABLE sessions ADD COLUMN auth_method text NOT NULL DEFAULT 'password'
 CHECK (auth_method IN ('password','sms'));
UPDATE sessions s SET privileged=EXISTS (
 SELECT 1 FROM memberships m WHERE m.user_id=s.user_id AND m.active
 AND m.role IN ('principal','platform_admin')
);
-- The password-plus-MFA flow has been replaced by two independent login methods.
UPDATE challenges SET consumed=true WHERE purpose='mfa';
