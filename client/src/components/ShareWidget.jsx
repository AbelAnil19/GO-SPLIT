import React from 'react';

const ShareWidget = () => {
    const appUrl = window.location.origin;
    const shareText = "Check out GoSplit - The easiest way to split expenses with friends! 🎯💰";

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            ),
            color: 'bg-[#25D366]',
            hoverColor: 'hover:bg-[#20bd5a]'
        },
        {
            name: 'Facebook',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.747-2.971 2.28v1.69h4.724l-1.383 3.667h-3.341v7.995c6.169-.446 10.917-5.592 10.917-11.758 0-6.529-5.352-11.791-11.89-11.791-6.594 0-11.892 5.257-11.892 11.791 0 6.136 4.706 11.272 10.823 11.753z" />
                </svg>
            ),
            color: 'bg-[#1877F2]',
            hoverColor: 'hover:bg-[#166fe5]'
        },
        {
            name: 'Twitter',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                </svg>
            ),
            color: 'bg-black',
            hoverColor: 'hover:bg-gray-900'
        },
        {
            name: 'LinkedIn',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                </svg>
            ),
            color: 'bg-[#0A66C2]',
            hoverColor: 'hover:bg-[#004182]'
        },
        {
            name: 'Telegram',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
            ),
            color: 'bg-[#0088cc]',
            hoverColor: 'hover:bg-[#007ab8]'
        },
        {
            name: 'Copy Link',
            icon: (
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
            ),
            color: 'bg-gray-700',
            hoverColor: 'hover:bg-gray-800',
            action: 'copy'
        }
    ];

    const handleShare = (link) => {
        if (link.action === 'copy') {
            navigator.clipboard.writeText(appUrl);
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-[60] animate-fade-in-up font-medium flex items-center gap-2';
            toast.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Link copied to clipboard!';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        } else {
            const urls = {
                'WhatsApp': `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + appUrl)}`,
                'Facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`,
                'Twitter': `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`,
                'LinkedIn': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`,
                'Telegram': `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`
            };
            window.open(urls[link.name], '_blank', 'width=600,height=400');
        }
    };

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
            {shareLinks.map((link, index) => (
                <div key={link.name} className="relative group flex justify-end">
                    <button
                        onClick={() => handleShare(link)}
                        className={`
                            group flex items-center justify-end
                            w-12 hover:w-40 h-12 
                            ${link.color} ${link.hoverColor} text-white
                            transition-all duration-300 ease-out
                            shadow-lg relative overflow-hidden
                            rounded-l-lg
                        `}
                        title={link.name}
                    >
                        {/* Label - Slides in on hover */}
                        <span className="whitespace-nowrap absolute right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm pr-4">
                            {link.name}
                        </span>

                        {/* Icon - Always visible */}
                        <div className="w-12 h-12 flex items-center justify-center text-xl shrink-0 z-10 relative">
                            {link.icon}
                        </div>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ShareWidget;
