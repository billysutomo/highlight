import React, { useEffect, useRef } from 'react';
import { message, Skeleton } from 'antd';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { AdminAvatar } from '../../components/Avatar/Avatar';
import { CircularSpinner } from '../../components/Loading/Loading';
import classNames from 'classnames/bind';

import commonStyles from '../../Common.module.scss';
import styles from './WorkspaceTeam.module.scss';
import {
    useGetAdminsQuery,
    useGetOrganizationQuery,
    useSendAdminInviteMutation,
} from '../../graph/generated/hooks';
import Button from '../../components/Button/Button/Button';
import useLocalStorage from '@rehooks/local-storage';

type Inputs = {
    email: string;
};

export const WorkspaceTeam = () => {
    const { organization_id } = useParams<{ organization_id: string }>();
    const emailRef = useRef<null | HTMLInputElement>(null);
    const { register, handleSubmit, errors, reset } = useForm<Inputs>();
    const { data: orgData } = useGetOrganizationQuery({
        variables: { id: organization_id },
    });
    const { data, error, loading } = useGetAdminsQuery({
        variables: { organization_id },
    });
    const [, setHasStartedOnboarding] = useLocalStorage(
        `highlight-started-onboarding-${organization_id}`,
        false
    );

    const [
        sendInviteEmail,
        { loading: sendLoading },
    ] = useSendAdminInviteMutation();

    useEffect(() => {
        reset();
    }, [reset]);

    const onSubmit = (data: Inputs) => {
        setHasStartedOnboarding(true);
        sendInviteEmail({
            variables: {
                organization_id,
                email: data.email,
            },
        }).then(() => {
            message.success(`Invite email sent to ${data.email}!`, 5);
            reset();
            emailRef.current?.focus();
        });
    };

    if (error) {
        return <div>{JSON.stringify(error)}</div>;
    }

    return (
        <div className={styles.teamPageWrapper}>
            <div className={styles.teamPage}>
                <h2>Invite A Member</h2>
                <p className={styles.subTitle}>
                    Invite a your team to your Workspace.
                </p>
                <div className={styles.box}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <h3>Invite Your Team</h3>
                        <p className={styles.boxSubTitle}>
                            Invite a team member to '
                            {`${orgData?.organization?.name}`}' by entering an
                            email below.
                        </p>
                        <div className={styles.buttonRow}>
                            <input
                                className={commonStyles.input}
                                placeholder={'Email'}
                                type="email"
                                name="email"
                                ref={(e) => {
                                    register(e, { required: true });
                                    emailRef.current = e;
                                }}
                            />
                            <Button
                                type="primary"
                                className={classNames(
                                    commonStyles.submitButton,
                                    styles.inviteButton
                                )}
                                htmlType="submit"
                            >
                                {sendLoading ? (
                                    <CircularSpinner
                                        style={{
                                            fontSize: 18,
                                            color:
                                                'var(--text-primary-inverted)',
                                        }}
                                    />
                                ) : (
                                    'Invite'
                                )}
                            </Button>
                        </div>
                        <div className={commonStyles.errorMessage}>
                            {errors.email &&
                                'Error validating email ' +
                                    errors.email.message}
                        </div>
                    </form>
                </div>
                <div className={styles.box}>
                    <h3>Members</h3>
                    {loading ? (
                        <Skeleton />
                    ) : (
                        data?.admins?.map((a) => {
                            return (
                                <div key={a?.id} className={styles.memberCard}>
                                    <AdminAvatar
                                        adminInfo={{
                                            email: a?.email,
                                            name: a?.name,
                                            photo_url: a?.photo_url,
                                        }}
                                        size={45}
                                    />
                                    <div className={styles.userDetails}>
                                        <h4 className={styles.name}>
                                            {a?.name
                                                ? a?.name
                                                : a?.email.split('@')[0]}
                                        </h4>
                                        <div className={styles.email}>
                                            {a?.email}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
