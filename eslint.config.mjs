import nx from '@nx/eslint-plugin';

export default [
    ...nx.configs['flat/base'],
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        rules: {
            '@nx/enforce-module-boundaries': [
                'error',
                {
                    enforceBuildableLibDependency: true,
                    allow: [],
                    depConstraints: [
                        {
                            sourceTag: 'scope:signal-store',
                            onlyDependOnLibsWithTags: ['scope:common'],
                        },
                        {
                            sourceTag: 'scope:mini-rx-store',
                            onlyDependOnLibsWithTags: ['scope:common'],
                        },
                        {
                            sourceTag: 'scope:signal-store-angular-demo-standalone',
                            onlyDependOnLibsWithTags: ['scope:signal-store'],
                        },
                        {
                            sourceTag: 'scope:mini-rx-angular-demo',
                            onlyDependOnLibsWithTags: [
                                'scope:mini-rx-store',
                                'scope:mini-rx-store-ng',
                            ],
                        },
                        {
                            sourceTag: 'scope:mini-rx-store-ng',
                            onlyDependOnLibsWithTags: ['scope:mini-rx-store', 'scope:common'],
                            allowedExternalImports: [
                                '@angular/*',
                                'rxjs',
                                'rxjs/*',
                                'jest-preset-angular/*',
                            ],
                        },
                    ],
                },
            ],
        },
    },
    ...nx.configs['flat/typescript'],
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'no-extra-semi': 'off',
        },
    },
    ...nx.configs['flat/javascript'],
    {
        files: ['**/*.js', '**/*.jsx'],
        rules: {
            'no-extra-semi': 'off',
        },
    },
];
