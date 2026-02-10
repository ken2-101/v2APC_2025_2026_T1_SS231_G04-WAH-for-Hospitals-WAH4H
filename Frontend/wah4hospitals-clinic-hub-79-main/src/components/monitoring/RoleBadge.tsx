import React from 'react';

interface RoleBadgeProps {
    role: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
    const getRoleStyles = (role: string) => {
        const normalizedRole = role.toLowerCase();

        const styles: Record<string, { bg: string; text: string; icon: string }> = {
            doctor: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '👨‍⚕️' },
            nurse: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '👩‍⚕️' },
            laboratory: { bg: 'bg-green-100', text: 'text-green-700', icon: '🔬' },
            scheduler: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '📅' },
            admin: { bg: 'bg-red-100', text: 'text-red-700', icon: '👑' },
        };

        return styles[normalizedRole] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '👤' };
    };

    const { bg, text, icon } = getRoleStyles(role);

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
            <span>{icon}</span>
            <span className="capitalize">{role}</span>
        </span>
    );
};
